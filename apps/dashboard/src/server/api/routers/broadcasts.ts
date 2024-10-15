import { trytm } from "@bdsqqq/try";
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { z } from "zod";

import {
  ActionArgumentType,
  ActionRunBehaviour,
  BroadcastType,
} from "@metrik/db/client";

import { env } from "@/env.mjs";
import type { Stripe } from "@/server/stripe";
import { createAuroraRouter } from "../aurora";
import {
  createTRPCRouter,
  onboardedProcedure,
  protectedProcedure,
  protectedProcedureWithCustomRateLimit,
  TRPCError,
} from "../trpc";
import { getRobloxUser } from "./commands";

function getEnv() {
  if (!env.VERCEL_ENV) {
    return "dev";
  }
  if (env.VERCEL_ENV === "production") {
    return "prod";
  }
  return "staging";
}

export const broadcastsRouter = createTRPCRouter({
  send: protectedProcedureWithCustomRateLimit(1000, 1)
    .input(
      z.object({
        projectId: z.string().trim(),
        message: z.string().trim(),
        type: z.nativeEnum(BroadcastType),
        serverIds: z.array(z.string().trim().uuid()), // NOAH: IGNORE THIS
        placeVersions: z.array(z.number().int().positive()), // NOAH: IGNORE THIS
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const aurora = createAuroraRouter(input.projectId, {
        method: "bearer",
        key: ctx.token,
      });

      const response = await aurora.broadcasts.send.post({
        message: input.message,
        type: input.type,
        serverIds: input.serverIds,
        placeVersions: input.placeVersions,
      });

      return response.data;
    }),
  getHistory: onboardedProcedure
    .input(
      z.object({
        projectId: z.string().trim(),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [broadcasts, totalItems] = await ctx.prisma.$transaction([
        ctx.prisma.broadcast.findMany({
          where: {
            projectId: input.projectId,
          },
          orderBy: {
            timestamp: "desc",
          },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.broadcast.count({
          where: {
            projectId: input.projectId,
          },
        }),
      ]);
      // remove duplicates from userIds

      const userIds = broadcasts
        .map((broadcast) => broadcast.userId)
        .filter((userId, index, self) => self.indexOf(userId) === index);

      const users = await Promise.all(
        userIds.map((userId) => getRobloxUser(Number(userId))),
      );

      const broadcastsWithUsers = broadcasts.map((broadcast) => ({
        ...broadcast,
        user: users.find((user) => String(user.userId) === broadcast.userId),
      }));

      return {
        broadcasts: broadcastsWithUsers,
        totalPages: Math.ceil(totalItems / input.pageSize),
      };
    }),
});
