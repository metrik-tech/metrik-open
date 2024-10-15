

import { Elysia } from "elysia";

import { analyticsJob } from "./analytics";
import { deleteOldDataJob } from "./delete-old-data";
import { errorQueueJob } from "./error-queue";
import { reportUsageJob } from "./report-usage";
import { stopInactiveServersJob } from "./stop-inactive-servers";

export const jobRouter = new Elysia({
  prefix: "/jobs",
});

type Handler = (request: Request) => Promise<Response>;

if (process.env.START_CRON !== "false") {
  jobRouter.mount("/analytics", analyticsJob);
  jobRouter.mount("/delete-old-data", deleteOldDataJob);
  jobRouter.mount("/report-usage", reportUsageJob as Handler);
  jobRouter.mount("/stop-inactive-servers", stopInactiveServersJob as Handler);
  jobRouter.mount("/error-queue", errorQueueJob as Handler);
}
