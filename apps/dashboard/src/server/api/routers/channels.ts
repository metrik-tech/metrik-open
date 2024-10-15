import { z } from "zod";

import { AuditType, MembershipRole } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { env } from "@/env.mjs";
import { stripe, Stripe } from "@/server/stripe";
import { logItem } from "@/utils/audit-log";
import { ValidEvents } from "@/utils/config";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureWithRateLimit,
  publicProcedure,
  TRPCError,
} from "../trpc";

export const channelsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.notificationChannel.findMany({
        where: {
          project: {
            id: input.projectId,
            studio: {
              membership: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
        include: {
          events: true,
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.notificationChannel.findFirst({
        where: {
          id: input.id,
          project: {
            studio: {
              membership: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
        include: {
          events: true,
        },
      });
    }),

  create: protectedProcedureWithRateLimit
    .input(
      z.object({
        projectId: z.string(),
        url: z.string().trim(),
        type: z.enum(["DISCORD", "SLACK", "GUILDED"]),
        nickname: z.string().trim().min(3).max(30),
        events: z.array(z.nativeEnum(ValidEvents)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = ctx.config.notificationServices.find(
        (service) => service.id === input.type,
      );

      if (!service?.regex.test(input.url)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid URL",
        });
      }

      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          studio: {
            membership: {
              some: {
                role: {
                  not: "USER",
                },
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          notificationChannels: true,
          studio: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving project",
        });
      }

      // await logItem(AuditType.CREATE_NOTIFICATION_CHANNEL, {
      //   userId: ctx.session.user.id,
      //   studioId: project.studioId,
      //   subject: input.nickname,
      // });

      return ctx.prisma.notificationChannel.create({
        data: {
          id: nid(),
          projectId: input.projectId,
          webhookUrl: input.url,
          type: input.type,
          nickname: input.nickname,
          events: {
            create: input.events.map((event) => {
              return {
                id: nid(),
                type: event,
              };
            }),
          },
          // events: {
          //   create: input.events.map((event) => {
          //     return {
          //       type: event,
          //     };
          //   }),
          // },
        },

        include: {
          events: true,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.prisma.notificationChannel.findFirst({
        where: {
          id: input.id,
          project: {
            studio: {
              membership: {
                some: {
                  role: MembershipRole.OWNER,
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
        include: {
          project: true,
        },
      });

      if (!channel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving channel",
        });
      }

      // await logItem(AuditType.DELETE_NOTIFICATION_CHANNEL, {
      //   userId: ctx.session.user.id,
      //   studioId: channel.project.studioId,
      //   subject: channel.nickname,
      // });

      return ctx.prisma.notificationChannel.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
