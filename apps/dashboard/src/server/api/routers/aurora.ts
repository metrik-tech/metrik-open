import { trytm } from "@bdsqqq/try";
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { z } from "zod";

import { ActionArgumentType, BroadcastType } from "@metrik/db/client";

import { env } from "@/env.mjs";
import type { Stripe } from "@/server/stripe";
import { createAuroraRouter } from "../aurora";
import {
  createTRPCRouter,
  onboardedProcedure,
  protectedProcedure,
  TRPCError,
} from "../trpc";

const statisticSchema = z.object({
  value: z.number(),
  delta: z.union([z.number(), z.null()]),
});

const analyticsSchema = z.object({
  timestamp: z.date(),
  playerCount: z.number(),
  visits: z.number(),
  newVisits: z.number(),
  estimatedAverageSessionLength: z.number(),
  favourites: z.number(),
  likes: z.number(),
  dislikes: z.number(),
  serverCount: z.number(),
  averageServerFps: z.number(),
  averageServerPing: z.number(),
  averageServerPlayers: z.number(),
});

const statsSchema = z.object({
  concurrentPlayers: statisticSchema,
  serverCount: statisticSchema,
  estimatedAverageSessionLength: statisticSchema,
  newVisits: statisticSchema,
  likeDislikeRatio: statisticSchema,
  favourites: statisticSchema,
  analytics: z.array(analyticsSchema),
});

type Stats = z.infer<typeof statsSchema>;

function getEnv() {
  if (!env.VERCEL_ENV) {
    return "dev";
  }
  if (env.VERCEL_ENV === "production") {
    return "prod";
  }
  return "staging";
}

export const auroraRouter = createTRPCRouter({
  analytics: protectedProcedure
    .input(
      z
        .object({
          from: z
            .date()
            .default(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)),
          to: z.date().default(new Date()),
          projectId: z.string(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      const aurora = createAuroraRouter(input.projectId, {
        method: "bearer",
        key: ctx.token,
      });

      const response = await aurora.analytics.stats.post({
        from: input.from,
        to: input.to,
        granularity: 15,
      });

      if (
        response.data?.analytics.some(
          (analytic) => typeof analytic.timestamp === "string",
        )
      ) {
        const newAnalytics = response.data?.analytics.map((analytic) => ({
          ...analytic,
          timestamp: new Date(analytic.timestamp),
        }));

        return {
          ...response.data,
          analytics: newAnalytics,
        };
      }

      return response.data;
    }),
});
