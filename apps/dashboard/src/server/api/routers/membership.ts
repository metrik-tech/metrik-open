import { z } from "zod";

import { AuditType } from "@metrik/db/client";

import { env } from "@/env.mjs";
import { type Stripe } from "@/server/stripe";
import { logItem } from "@/utils/audit-log";
import { constants } from "@/utils/stripe/constants";
import {
  createTRPCRouter,
  onboardedProcedure,
  protectedProcedure,
  TRPCError,
} from "../trpc";

export const membershipRouter = createTRPCRouter({
  getMember: onboardedProcedure
    .input(z.object({ studioId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.membership.findFirst({
        where: {
          studioId: input.studioId,
          userId: ctx.session.user.id,
        },
      });
    }),
  leave: onboardedProcedure
    .input(z.object({ studioId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

      const membership = await ctx.prisma.membership.findFirst({
        where: {
          studioId: input.studioId,
          userId: ctx.session.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving membership",
        });
      }

      // await logItem(AuditType.LEAVE_STUDIO, {
      //   userId: ctx.session.user.id,
      //   studioId: input.studioId,
      //   subject: undefined,
      // });

      return ctx.prisma.membership.delete({
        where: {
          id: membership.id,
        },
      });
    }),

  removeMember: onboardedProcedure
    .input(z.object({ studioId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              role: {
                in: ["OWNER", "ADMIN"],
              },
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!studio) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Must be owner or admin to update roles",
        });
      }

      const membership = await ctx.prisma.membership.findFirst({
        where: {
          studioId: input.studioId,
          userId: input.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving membership",
        });
      }

      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
        },
      });

      // await logItem(AuditType.REMOVE_MEMBER, {
      //   userId: ctx.session.user.id,
      //   studioId: input.studioId,
      //   subject: user?.name || "Unknown user",
      // });

      return ctx.prisma.membership.delete({
        where: {
          id: membership.id,
        },
      });
    }),
  updateMember: onboardedProcedure
    .input(
      z.object({
        studioId: z.string(),
        userId: z.string(),
        role: z.enum(["ADMIN", "USER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              role: {
                in: ["OWNER", "ADMIN"],
              },
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!studio) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Must be owner or admin to update roles",
        });
      }

      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
        },
      });

      // await logItem(AuditType.CHANGE_MEMBER_ROLE, {
      //   userId: ctx.session.user.id,
      //   studioId: input.studioId,
      //   subject: `${user?.name || "Unknown user"} to ${input.role}`,
      // });

      const membership = await ctx.prisma.membership.findFirst({
        where: {
          studioId: input.studioId,
          userId: input.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving membership",
        });
      }

      return ctx.prisma.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          role: input.role,
        },
      });
    }),
});
