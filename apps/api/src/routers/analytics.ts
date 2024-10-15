import cuid from "cuid";
import { differenceInMilliseconds } from "date-fns";
import { Elysia, t } from "elysia";
import { server } from "typescript";
import { z } from "zod";

import type { Analytic } from "@metrik/db/client";

import { context } from "../context";
import { getDelta } from "../utils/delta";
import { MError } from "../utils/error";

function formatDateToUTC(date: Date) {
  const utcDate = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );

  const newDate = new Date(utcDate);

  const isoString = newDate.toISOString();
  const datePart = isoString.substring(0, 10);
  const timePart = isoString.substring(11, 19);
  return `${datePart} ${timePart}`;
}

async function getStats<T extends "many" | "single">(
  projectId: string,
  method: T,
  {
    gte,
    lte,
  }: {
    gte?: Date;
    lte?: Date;
  },
) {
  return await fetch(
    `https://analytics.ethan-d07.workers.dev/${method}?projectId=${projectId}${lte ? `&lte=${encodeURIComponent(formatDateToUTC(lte))}` : ""}${gte ? `&gte=${encodeURIComponent(formatDateToUTC(gte))}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ANALYTICS_API_KEY}`,
      },
    },
  ).then(
    (res) => res.json() as Promise<T extends "many" ? Analytic[] : Analytic>,
  );
}

export const statisticSchemaOld = z.object({
  value: z.number(),
  delta: z.union([z.number(), z.null()]),
});

export const analyticsSchemaOld = z.object({
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

export const outputSchemaOld = z.object({
  concurrentPlayers: statisticSchemaOld,
  serverCount: statisticSchemaOld,
  newVisits: statisticSchemaOld,
  estimatedAverageSessionLength: statisticSchemaOld,
  likeDislikeRatio: statisticSchemaOld,
  favourites: statisticSchemaOld,
  analytics: z.array(analyticsSchemaOld),
});

const statisticSchema = t.Object({
  value: t.Number(),
  delta: t.Union([t.Number(), t.Null()]),
});

const analyticsSchema = t.Object({
  timestamp: t.Date(),
  playerCount: t.Number(),
  visits: t.Number(),
  newVisits: t.Number(),
  estimatedAverageSessionLength: t.Number(),
  favourites: t.Number(),
  likes: t.Number(),
  dislikes: t.Number(),
  serverCount: t.Number(),
  averageServerFps: t.Number(),
  averageServerPing: t.Number(),
  averageServerPlayers: t.Number(),
});

const outputSchema = t.Object({
  concurrentPlayers: statisticSchema,
  serverCount: statisticSchema,
  newVisits: statisticSchema,
  estimatedAverageSessionLength: statisticSchema,
  likeDislikeRatio: statisticSchema,
  favourites: statisticSchema,
  analytics: t.Array(analyticsSchema),
});

const analyticsSchemaArray = z.array(analyticsSchemaOld);

type Output = z.infer<typeof outputSchemaOld>;
type Analytics = z.infer<typeof analyticsSchemaArray>;

const cache = new Map<string, Output>();

setInterval(
  () => {
    cache.clear();
  },
  1000 * 60 * 60 * 24, // 1 day
);

export const analyticsRouter = new Elysia({ prefix: "/analytics" })
  .use(context)
  .post(
    "/stats",
    async ({ prisma, project, body }) => {
      if (!body.from) {
        body.from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
      }

      if (!body.to) {
        body.to = new Date();
      }

      const { from, to } = body;

      if (
        project.createdAt.getTime() <
        new Date(from.getTime() - to.getTime()).getTime() * 2
      ) {
        throw new MError({
          message: "Project is too new",
          code: "BAD_REQUEST",
        });
      }

      const key = JSON.stringify({ from, to, project: project.id });

      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const difference = differenceInMilliseconds(to, from);

      const [
        lastLastPeriod,
        lastPeriod,
        latest,
        lastPeriodAnalytics,
        analytics,
      ] = await prisma.$transaction([
        prisma.analytic.findFirst({
          where: {
            projectId: project.id,
            timestamp: {
              lte: new Date(from.getTime() - difference),
              gte: new Date(from.getTime() - difference * 2),
            },
          },
        }),
        prisma.analytic.findFirst({
          where: {
            projectId: project.id,
            timestamp: {
              lte: from,
              gte: new Date(from.getTime() - difference),
            },
          },
        }),
        prisma.analytic.findFirst({
          where: {
            projectId: project.id,
            timestamp: {
              lte: to,
            },
          },
          orderBy: {
            timestamp: "desc",
          },
        }),
        prisma.analytic.findMany({
          where: {
            projectId: project.id,
            timestamp: {
              lte: from,
              gte: new Date(from.getTime() - difference),
            },
          },
        }),
        prisma.analytic.findMany({
          where: {
            projectId: project.id,
            timestamp: {
              gte: from,
              lte: to,
            },
          },
        }),
      ]);

      const dataDifference = differenceInMilliseconds(
        analytics[1]?.timestamp ?? new Date(),
        analytics[0]?.timestamp ?? new Date(),
      );

      if (!analytics.length || !latest) {
        throw new MError({
          message: "No analytics found. There may not be enough data.",
          code: "NOT_FOUND",
        });
      }

      const concurrentPlayers =
        analytics.reduce((acc, curr) => acc + curr.playerCount, 0) /
          analytics.length ?? 0;

      const lastPeriodConcurrentPlayers = lastPeriod
        ? lastPeriodAnalytics.reduce((acc, curr) => acc + curr.playerCount, 0) /
          lastPeriodAnalytics.length
        : 0;

      const concurrentPlayersDelta = lastPeriod
        ? getDelta(concurrentPlayers, lastPeriodConcurrentPlayers)
        : null;

      const serverCount =
        Math.floor(
          analytics.reduce((acc, curr) => acc + curr.serverCount, 0) /
            analytics.length ?? 0,
        ) ?? 0;

      const lastPeriodServerCount = lastPeriod
        ? lastPeriodAnalytics.reduce((acc, curr) => acc + curr.serverCount, 0) /
          lastPeriodAnalytics.length
        : 0;

      const serverCountDelta = lastPeriod
        ? getDelta(serverCount ?? 0, lastPeriodServerCount ?? 0)
        : 0;

      const newVisits =
        Number(latest.visits) - Number(lastPeriod?.visits ?? latest.visits) ??
        0;

      const newVisitsDelta =
        lastLastPeriod && lastPeriod
          ? getDelta(
              newVisits,
              Number(lastPeriod.visits) - Number(lastLastPeriod.visits),
            )
          : 0;

      const likeDislikeRatio = isNaN(
        latest.likes / (latest.dislikes + latest.likes),
      )
        ? 0
        : latest.likes / (latest.dislikes + latest.likes);

      const likeDislikeRatioDelta = lastPeriod
        ? getDelta(
            likeDislikeRatio,
            lastPeriod.likes / (lastPeriod.dislikes + lastPeriod.likes),
          )
        : null;

      const favourites = latest.favourites;

      const favouritesDelta = lastPeriod
        ? getDelta(favourites, lastPeriod.favourites)
        : null;

      const estimatedAverageSessionLength = concurrentPlayers
        ? ((difference / 1000 / 60) * concurrentPlayers) /
          (Number(analytics[analytics.length - 1]?.visits ?? 0) -
            Number(analytics[0]?.visits ?? 0) ?? 0)
        : 0;

      const estimatedAverageSessionLengthDelta = lastPeriod
        ? getDelta(
            estimatedAverageSessionLength,
            ((difference / 1000 / 60) * lastPeriodConcurrentPlayers) /
              (Number(
                lastPeriodAnalytics[lastPeriodAnalytics.length - 1]?.visits ??
                  0,
              ) -
                Number(lastPeriodAnalytics[0]?.visits ?? 0)),
          )
        : null;

      function calcEstimatedAverageSessionLength(
        analytic: Analytic,
        index: number,
      ): number {
        const value =
          (15 * analytic.playerCount) /
          (Number(analytic.visits) -
            Number(analytics[index - 1]?.visits ?? analytic.visits));

        if (isNaN(value) || value === Infinity) {
          return 0;
        }

        return value;
      }

      console.log(typeof analytics[0]?.timestamp);

      const stats = {
        concurrentPlayers: {
          value: Number(concurrentPlayers.toFixed()),
          delta: concurrentPlayersDelta,
        },
        serverCount: {
          value: serverCount,
          delta: serverCountDelta,
        },
        estimatedAverageSessionLength: {
          value:
            estimatedAverageSessionLength === Infinity
              ? 0
              : estimatedAverageSessionLength,
          delta: estimatedAverageSessionLengthDelta,
        },
        newVisits: {
          value: newVisits,
          delta: newVisitsDelta,
        },
        likeDislikeRatio: {
          value: likeDislikeRatio,
          delta: likeDislikeRatioDelta,
        },
        favourites: {
          value: favourites,
          delta: favouritesDelta,
        },

        analytics: analytics
          .map((analytic, index) => ({
            timestamp: analytic.timestamp,
            playerCount: analytic.playerCount,
            visits: Number(analytic.visits),
            newVisits:
              Number(analytic.visits) -
              Number(analytics[index - 1]?.visits ?? 0),
            estimatedAverageSessionLength: calcEstimatedAverageSessionLength(
              analytic as Analytic,
              index,
            ),
            favourites: analytic.favourites,
            likes: analytic.likes,
            dislikes: analytic.dislikes,
            serverCount: analytic.serverCount,
            averageServerFps: analytic.averageServerFps,
            averageServerPing: analytic.averageServerPing,
            averageServerPlayers: analytic.averageServerPlayers,
          }))
          .filter((analytic) => {
            return (
              analytic.timestamp.getMinutes() % (body.granularity ?? 15) === 0
            );
          })
          .slice(1),
      };

      console.log({
        concurrentPlayers: stats.concurrentPlayers,
        serverCount: stats.serverCount,
        estimatedAverageSessionLength: stats.estimatedAverageSessionLength,
        newVisits: stats.newVisits,
        likeDislikeRatio: stats.likeDislikeRatio,
        favourites: stats.favourites,
      });

      cache.set(key, stats);

      return stats;
    },
    {
      type: "application/json",
      body: t.Object({
        from: t.Optional(
          t.Date({
            default: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          }),
        ),
        to: t.Optional(t.Date({ default: new Date() })),
        granularity: t.Optional(t.Number({ default: 15 })),
      }),
      response: outputSchema,
      detail: {
        tags: ["Analytics"],
        summary: "Get statistics",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  );
