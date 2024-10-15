import consola from "consola";

import { prisma } from "@metrik/db";

import { CronJob as QuirrelJob } from "quirrel/next-app"
import { CronJob } from "../utils/cron";

export const deleteOldDataJob = CronJob("jobs/delete-old-data", "0 0 * * *", async () => {
  const studios = await prisma.studio.findMany({
    include: {
      usageLimits: true,
      projects: true,
    },
  });

  let deletedAnalyticsCount = 0;
  let deletedRunsCount = 0;
  let deletedAuditLogsCount = 0;

  await Promise.allSettled(
    studios.map(async (studio) => {
      const analyticsRetention = new Date(
        Date.now() -
          1000 * 60 * 60 * 24 * (studio.usageLimits?.analyticsRetention ?? 90),
      );

      const auditRetention = new Date(
        Date.now() -
          1000 * 60 * 60 * 24 * (studio.usageLimits?.auditLogRetention ?? 90),
      );

      const [deletedAnalytics, deletedRuns, deletedAuditLogs] =
        await prisma.$transaction([
          prisma.analytic.deleteMany({
            where: {
              projectId: {
                in: studio.projects.map((project) => project.id),
              },
              timestamp: {
                lte: analyticsRetention,
              },
            },
          }),
          prisma.actionRun.deleteMany({
            where: {
              projectId: {
                in: studio.projects.map((project) => project.id),
              },
              timestamp: {
                lte: auditRetention,
              },
            },
          }),
          prisma.auditItem.deleteMany({
            where: {
              studioId: studio.id,
              createdAt: {
                lte: auditRetention,
              },
            },
          }),
          prisma.moderationEvent.deleteMany({
            where: {
              projectId: {
                in: studio.projects.map((project) => project.id),
              },
              timestamp: {
                lte: auditRetention,
              },
            },
          }),
        ]);

      deletedAnalyticsCount += deletedAnalytics.count;
      deletedRunsCount += deletedRuns.count;
      deletedAuditLogsCount += deletedAuditLogs.count;
    }),
  );

  //   const [deletedAnalytics, deletedRuns] = await prisma.$transaction([
  //     prisma.analytic.deleteMany({
  //       where: {
  //         timestamp: {
  //           lte: pro ? thirtyDaysAgo : sevenDaysAgo,
  //         },
  //         project: {
  //           studio: {
  //             plan: {
  //               in: pro ? ["PRO", "PARTNER"] : ["FREE"],
  //             },
  //           },
  //         },
  //       },
  //     }),
  //     prisma.actionRun.deleteMany({
  //       where: {
  //         timestamp: {
  //           lte: pro ? ninetyDaysAgo : fourteenDaysAgo,
  //         },
  //         project: {
  //           studio: {
  //             plan: {
  //               in: pro ? ["PRO", "PARTNER"] : ["FREE"],
  //             },
  //           },
  //         },
  //       },
  //     }),
  //     prisma.auditItem.deleteMany({
  //       where: {
  //         createdAt: {
  //           lte: pro ? ninetyDaysAgo : fourteenDaysAgo,
  //         },
  //         studio: {
  //           plan: {
  //             in: pro ? ["PRO", "PARTNER"] : ["FREE"],
  //           },
  //         },
  //       },
  //     }),
  //   ]);

  consola.info(
    `Deleted ${deletedAnalyticsCount} analytics, ${deletedRunsCount} runs, and ${deletedAnalyticsCount} audit logs`,
  );
})
