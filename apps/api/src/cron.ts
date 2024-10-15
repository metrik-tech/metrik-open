import Owl from "@quirrel/owl";
import cronParser from "cron-parser";
import { Handler } from "elysia";

import { consola } from "./utils/log";
import { redisFactory } from "./utils/redis";
import Sentry from "./utils/sentry";

export function parseTimezonedCron(
  cronExpression: string,
): [cron: string, tz: string] {
  return [cronExpression, "Etc/UTC"] as [cron: string, tz: string];
}

export function cronSchedule(last: Date, cron: string): Date {
  return cronParser
    .parseExpression(cron, {
      currentDate: last,
      tz: "Etc/UTC",
    })
    .next()
    .toDate();
}

export const owl = new Owl({
  redisFactory,
  scheduleMap: {
    cron: cronSchedule,
  },
  onError: (error) => {
    console.log(error);
  },
});

type CronJob = () => Promise<void>;

type CronJobs = {
  name: string;
  cron: string;
  handler: CronJob;
};

const log = consola.withTag("cron");

export const createCronJobs = async (cronJobs: CronJobs[]) => {
  const producer = owl.createProducer();
  const redis = redisFactory();

  const worker = await owl.createWorker(async (job, ackDescriptor) => {
    console.log(job, "CRON");
    if (job.id !== "@cron") {
      return;
    }

    try {
      const cronJob = cronJobs.find(
        (cronJob) => cronJob.name === job.queue.split("/")[1],
      );

      if (!cronJob) {
        throw new Error(`No cron job found for queue ${job.queue}`);
      }

      consola.info(`Running cron job ${cronJob.name}`);

      await producer.acknowledger.acknowledge(ackDescriptor);

      await Sentry.withMonitor(
        cronJob.name,
        async () => {
          await cronJob.handler();
        },
        {
          schedule: {
            type: "crontab",
            value: cronJob.cron,
          },
          checkinMargin: 2,
          maxRuntime: 7,
        },
      );

      console.log(ackDescriptor);
    } catch (error) {
      await producer.acknowledger.reportFailure(ackDescriptor, job, error);
      console.log(error, "ERROR");
    }

    return;
  });

  const existingQueues = await redis.smembers(`cron-queues`);
  const queuesThatShouldPersist = cronJobs.map((cronJob) => cronJob.name);

  const deleted = new Set<string>();

  await Promise.all(
    existingQueues.map(async (queue) => {
      if (!queuesThatShouldPersist.includes(queue)) {
        await producer.delete(`cron/${queue}`, "@cron");
        deleted.add(queue);
        // await redis.srem(`queues:cron`, queue);
      }
    }),
  ).then(() => {
    log.info(`Deleted ${deleted.size} cron jobs`);
  });

  try {
    await Promise.all(
      Object.entries(cronJobs).map(async ([_, cronJob]) => {
        await redis.sadd(`queues:cron`, cronJob.name);
        return producer.enqueue({
          id: "@cron",
          queue: `cron/${cronJob.name}`,
          override: true,
          payload: "null",
          schedule: {
            type: "cron",
            meta: cronJob.cron,
          },
          runAt: cronParser.parseExpression(cronJob.cron).next().toDate(),
        });
      }),
    );

    log.info("Cron jobs started");
    console.table(cronJobs.map(({ name, cron }) => ({ name, cron })));
  } catch (error) {
    await worker.close();
    await producer.close();
    throw error;
  }

  return {
    close: async () => {
      await worker.close();
      await producer.close();
      redis.disconnect();
    },
  };
};
