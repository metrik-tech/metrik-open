import { CronJob as QuirrelJob } from "quirrel/next-app";

import Sentry from "./sentry";

type Handler = (request: Request) => Promise<Response>;

export function CronJob(
  name: string,
  crontab: string,
  callback: () => unknown,
) {
  return QuirrelJob(name, crontab, async () => {
    console.log(`Running job ${name}`);
    await Sentry.withMonitor(
      name.split("/")[1]!,
      async () => {
        try {
          await callback();
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      },
      {
        schedule: {
          type: "crontab",
          value: crontab,
        },
        checkinMargin: 2,
        maxRuntime: 7,
      },
    );
  }) as Handler;
}
