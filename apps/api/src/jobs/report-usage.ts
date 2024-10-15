import consola from "consola";

import { stripe } from "../utils/stripe";
import { prisma } from "@metrik/db";
import { constants } from "@metrik/stripe-constants";

import { CronJob as QuirrelJob } from "quirrel/next-app"
import { CronJob } from "../utils/cron";

export const reportUsageJob = CronJob("jobs/report-usage", "0 0 * * *", async () => {
  const projects = await prisma.project.findMany({
    where: {
      studio: {
        stripeSubscriptionId: {
          not: null,
        },
      },
    },
    include: {
      studio: {
        include: {
          usageLimits: true,
        },
      },
    },
  });

  const promises = projects.map(async (project) => {
    if (!project.studio.stripeSubscriptionId) return;
    const [latestAnalytics, lastPeriodAnalytics] = await prisma.$transaction([
      prisma.analytic.findFirst({
        where: {
          projectId: project.id,
        },
        orderBy: {
          timestamp: "desc",
        },
      }),
      prisma.analytic.findFirst({
        where: {
          projectId: project.id,
          timestamp: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      }),
    ]);

    const experienceVisitsCount =
      Number(latestAnalytics?.visits ?? 0) -
      Number(lastPeriodAnalytics?.visits ?? 0);

    const items = await stripe.subscriptionItems.list({
      subscription: project.studio.stripeSubscriptionId,
    });

    const visitsItem = items.data.find(
      (item) =>
        item.price.id ===
        (process.env.NODE_ENV === "production"
          ? constants.plans.PRO.itemIds.production.visits
          : constants.plans.PRO.itemIds.test.visits),
    );

    if (!visitsItem) {
      throw new Error("Could not find subscription items");
    }

    // create a list of promises, then await them all

    try {
      const visits = await stripe.subscriptionItems.createUsageRecord(
        visitsItem.id,
        {
          quantity: experienceVisitsCount,
          action: "increment",
          timestamp: "now",
        },
      );
    } catch (error) {
      consola.error(error);
    }

    throw new Error("Could not create usage record");
  });

  await Promise.all(promises);

  consola.info(`Reported usage for ${projects.length} projects`);
});
