import { trytm } from "@bdsqqq/try";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

import { AuditType } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { env } from "@/env.mjs";
import { logItem } from "@/utils/audit-log";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureWithRateLimit,
  TRPCError,
} from "../trpc";

const randomHex = (bytes = 4) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");

const useRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),

  limiter: Ratelimit.slidingWindow(3, "5 m"),
  analytics: false,
  prefix: "useinvite",
});

const getDetailsRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: false,
  prefix: "getdetailsinvite",
});

export const invitesRouter = createTRPCRouter({
  create: protectedProcedureWithRateLimit
    .input(
      z.object({
        studioId: z.string(),
        uses: z.number().max(100).optional(),
        nickname: z.string().trim().max(30).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [invites, studio] = await ctx.prisma.$transaction([
        ctx.prisma.invite.findMany({
          where: {
            studioId: input.studioId,
          },
        }),
        ctx.prisma.studio.findFirst({
          where: {
            id: input.studioId,
            membership: {
              some: {
                role: "OWNER",
                userId: ctx.session.user.id,
              },
            },
          },
        }),
      ]);

      if (!studio) {
        throw new TRPCError({
          message: "Must be OWNER to create an invite.",
          code: "UNAUTHORIZED",
        });
      }

      let activeInviteCount = 0;
      invites.forEach((invite) => {
        if (invite.limitedUses && invite.usesRemaining !== 0) {
          activeInviteCount++;
        } else if (!invite.limitedUses) {
          activeInviteCount++;
        }
      });

      if (activeInviteCount >= 5) {
        throw new TRPCError({
          message: "You can only have 5 active invites",
          code: "BAD_REQUEST",
        });
      }

      const inviteCode = randomHex().toUpperCase();

      // await logItem(AuditType.CREATE_INVITE, {
      //   userId: ctx.session.user.id,
      //   studioId: input.studioId,
      //   subject: input.nickname,
      // });

      return ctx.prisma.invite.create({
        data: {
          id: nid(),
          nickname: input.nickname,
          limitedUses: !!input.uses,
          usesRemaining: input.uses,
          code: inviteCode,
          studioId: input.studioId,
        },
      });
    }),

  get: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .trim()
          // .length(8, "Codes are 8 alphanumeric characters long")
          .toUpperCase(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { success } = await getDetailsRatelimit.limit(ctx.session.user.id);

      if (!success) {
        throw new TRPCError({
          message: "Slow down!",
          code: "TOO_MANY_REQUESTS",
        });
      }

      const invite = await ctx.prisma.invite.findFirst({
        where: {
          code: input.code,
        },
        include: {
          studio: {
            select: {
              name: true,
              id: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!invite) {
        throw new TRPCError({
          message: "No invite found",
          code: "BAD_REQUEST",
        });
      }

      return invite;
    }),
  use: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .trim()
          .length(8, "Codes are 8 alphanumeric characters long")
          .toUpperCase(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await useRatelimit.limit(ctx.session.user.id);

      if (!success) {
        throw new TRPCError({
          message: "Slow down!",
          code: "TOO_MANY_REQUESTS",
        });
      }

      const invite = await ctx.prisma.invite.findFirst({
        where: {
          code: input.code,
        },
      });

      if (!invite) {
        throw new TRPCError({
          message: "No invite found",
          code: "BAD_REQUEST",
        });
      }

      if (invite.limitedUses && invite.usesRemaining === 0) {
        throw new TRPCError({
          message: "No invite found",
          code: "BAD_REQUEST",
        });
      }

      const existingMembership = await ctx.prisma.membership.findFirst({
        where: {
          studioId: invite.studioId,
          userId: ctx.session.user.id,
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          message: "You are already a member of this studio",
          code: "BAD_REQUEST",
        });
      }

      if (invite.limitedUses) {
        await ctx.prisma.invite.update({
          where: {
            id: invite.id,
          },
          data: {
            usesRemaining: invite.usesRemaining
              ? invite.usesRemaining - 1
              : invite.usesRemaining,
          },
        });
      }

      const membership = await ctx.prisma.membership.create({
        data: {
          role: "USER",
          id: nid(),
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          studio: {
            connect: {
              id: invite.studioId,
            },
          },
        },
        include: {
          studio: true,
        },
      });

      await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          onboarded: true,
        },
      });

      // await logItem(AuditType.JOIN_STUDIO, {
      //   userId: ctx.session.user.id,
      //   studioId: invite.studioId,
      //   subject: "joined",
      // });

      return membership.studio;
    }),

  getAll: protectedProcedure
    .input(z.object({ studioId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invite.findMany({
        where: {
          studioId: input.studioId,
          studio: {
            membership: {
              some: {
                role: "OWNER",
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), studioId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [invite, studio] = await ctx.prisma.$transaction([
        ctx.prisma.invite.findFirst({
          where: {
            id: input.id,
            studioId: input.studioId,
          },
        }),
        ctx.prisma.studio.findFirst({
          where: {
            id: input.studioId,
            membership: {
              some: {
                role: "OWNER",
                userId: ctx.session.user.id,
              },
            },
          },
        }),
      ]);

      if (!studio) {
        throw new TRPCError({
          message: "Must be OWNER to delete invites",
          code: "UNAUTHORIZED",
        });
      }

      if (!invite) {
        throw new TRPCError({
          message: "Error resolving invite",
          code: "BAD_REQUEST",
        });
      }

      // await logItem(AuditType.DELETE_INVITE, {
      //   userId: ctx.session.user.id,
      //   studioId: input.studioId,
      //   subject: invite.nickname,
      // });

      return ctx.prisma.invite.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
