import { z } from "zod";

import { prisma } from "@metrik/db";
import { AuditType } from "@metrik/db/client";
import { nid } from "@metrik/id";
import { june } from "@metrik/june";

import { type Stripe } from "@/server/stripe";
import { normalize } from "@/utils/ascii";
import { logItem } from "@/utils/audit-log";
import { constants } from "@/utils/stripe/constants";
import {
  createTRPCRouter,
  onboardedProcedure,
  protectedProcedure,
  protectedProcedureWithRateLimit,
  TRPCError,
  type TRPCContext,
} from "../trpc";

export const studiosRouter = createTRPCRouter({
  getUsageLimits: onboardedProcedure
    .input(z.object({ studioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          usageLimits: true,
        },
      });

      if (!studio) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving studio",
        });
      }

      return studio.usageLimits;
    }),

  getAuditLog: onboardedProcedure
    .input(z.object({ studioId: z.string(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!studio) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving studio",
        });
      }

      const logs = await ctx.prisma.auditItem.findMany({
        where: {
          studioId: input.studioId,
        },
        cursor: input.cursor
          ? { createdAt: new Date(input.cursor) }
          : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          studio: true,
        },
        take: 11,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (logs.length > 10) {
        const nextItem = logs.pop();

        nextCursor = nextItem!.createdAt.toISOString();
      }

      return {
        logs,
        nextCursor,
      };
    }),

  getAll: onboardedProcedure.query(async ({ ctx }) => {
    const studios = await ctx.prisma.studio.findMany({
      where: {
        membership: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        projects: true,
        membership: true,
      },
    });

    if (!studios) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Not in any studios",
      });
    }

    studios.map((studio) => {
      june.group({
        userId: ctx.session.user.id,
        groupId: studio.id,
        traits: {
          name: studio.name,
          avatar: studio.avatarUrl ?? undefined,
        },
      });
    });

    return studios;
  }),

  get: onboardedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.id,
          membership: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          projects: true,
        },
      });

      if (!studio) {
        return null;
      }

      june.group({
        userId: ctx.session.user.id,
        groupId: input.id,
        traits: {
          name: studio.name,
          avatar: studio.avatarUrl ?? undefined,
        },
      });

      return studio;
    }),

  create: protectedProcedureWithRateLimit
    .input(
      z.object({
        name: z.string().trim().min(3).max(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return create({ user: ctx.session.user, input });
    }),

  update: protectedProcedureWithRateLimit
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(3).max(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.id,
          membership: {
            some: {
              role: "OWNER",
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!studio) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving studio",
        });
      }

      if (studio.stripeSubscriptionId) {
        await ctx.stripe.subscriptions.update(studio.stripeSubscriptionId, {
          description: input.name,
        });
      }

      // await logItem(AuditType.RENAME_STUDIO, {
      //   userId: ctx.session.user.id,
      //   studioId: input.id,
      //   subject: input.name,
      // });

      return ctx.prisma.studio.update({
        where: {
          id: input.id,
        },
        data: {
          name: normalize(input.name),
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.id,
          membership: {
            some: {
              role: "OWNER",
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!studio) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving studio",
        });
      }

      const otherStudios = await ctx.prisma.studio.count({
        where: {
          membership: {
            some: {
              userId: ctx.session.user.id,
            },
          },
          id: {
            not: studio.id,
          },
        },
      });

      if (otherStudios === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be a member of at least one studio.",
        });
      }

      if (studio.stripeSubscriptionId) {
        try {
          const subscription = await ctx.stripe.subscriptions.retrieve(
            studio.stripeSubscriptionId,
          );

          if (subscription.status === "active") {
            await ctx.stripe.subscriptions.cancel(studio.stripeSubscriptionId);
          }
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error deleting subscription",
          });
        }
      }

      return ctx.prisma.studio.delete({
        where: {
          id: input.id,
        },
      });
    }),
});

export type CreateStudio = Parameters<typeof create>[0];
export type CreateStudioInput = Parameters<typeof create>[0]["input"];

export async function create({
  input,
  user,
}: {
  input: {
    name: string;
    trialEnd?: Date;
    planSlug?: string;
  };
  user: {
    id: string;
  };
}) {
  const existingStudios = await prisma.studio.count({
    where: {
      membership: {
        some: {
          role: "OWNER",
          userId: user.id,
        },
      },
    },
  });

  if (existingStudios >= 10) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You can only own 10 studios. To request more, contact us.",
    });
  }

  const id = nid();

  try {
    const studio = await prisma.studio.create({
      data: {
        id,
        name: normalize(input.name),
        trialEnds: input.trialEnd,
        planSlug: input.planSlug ?? "Unsubscribed",
        plan: input.trialEnd ? "TRIAL" : "NONE",
        membership: {
          create: {
            id: nid(),
            role: "OWNER",
            user: {
              connect: {
                id: user.id,
              },
            },
          },
        },
        usageLimits: {
          create: input.trialEnd
            ? { id: nid(), ...constants.plans.PRO.usageLimits }
            : { id: nid(), ...constants.plans.NONE.usageLimits },
        },
      },
      include: {
        membership: true,
      },
    });

    return studio;
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  }
}
