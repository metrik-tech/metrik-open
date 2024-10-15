// import Owl, { type Job, type JobEnqueue, type ScheduleMap } from "@quirrel/owl";
// import { type Producer } from "@quirrel/owl/dist/producer/producer";
// import {
//   type AcknowledgementDescriptor,
//   type OnError,
// } from "@quirrel/owl/dist/shared/acknowledger";
// import { Queue, Worker } from "bullmq";
// import cronParser from "cron-parser";
// import { type Redis } from "ioredis";
// import pino, { type DestinationStream, type Logger } from "pino";
// import superjson from "superjson";

// import { nid } from "@metrik/id";

// import { cronSchedule } from "./cron";
// import { cronJobs } from "./jobs";
// import { queues } from "./queues";
// import { log } from "./utils/discord";
// import { redisFactory } from "./utils/redis";
// import Sentry from "./utils/sentry";

// const logger = pino(
//   { level: "trace" },
//   pino.transport({
//     target: "@axiomhq/pino",
//     options: {
//       dataset: "api",
//       token: process.env.AXIOM_TOKEN,
//     },
//   }) as DestinationStream,
// );

// type CronJob = () => Promise<void>;

// type CronJobs = {
//   name: string;
//   cron: string;
//   handler: CronJob;
// };

// interface QueueParams {
//   queue: string;
//   options?: {
//     runAt?: Date;
//     exclusive?: boolean;
//     override?: boolean;
//     retry?: number[];
//   };
// }

// export type OwlQueue = (
//   payload: unknown,
//   job: QueueParams,
// ) => Promise<void> | void;

// const backgroundJobs = new Map<string, () => Promise<void>>();

// function createWorker({
//   redisFactory: rf,
//   logger,
//   onError,
//   scheduleMap,
// }: {
//   redisFactory: (prefix?: string) => Redis;
//   logger: Logger;
//   onError: OnError<"cron">;
//   scheduleMap: ScheduleMap<"cron">;
// }) {
//   const owl = new Owl({
//     redisFactory: rf,
//     logger,
//     onError,
//     scheduleMap,
//   });

//   return owl.createWorker(async (job, ackDescriptor) => {
//     console.log("WORKERING");
//     try {
//       console.log(job, "WORKER");
//       if (job.id === "@cron") {
//         console.log("IS A CRON JOB");

//         await cronWorker({
//           job,
//           ackDescriptor,
//           producer: owl.createProducer(),
//           cronJobs,
//         });
//         return;
//       }

//       if (job.queue === "background-job") {
//         console.log("IS A BACKGROUND JOB");
//         await backgroundJobWorker({
//           job,
//           ackDescriptor,
//           producer: owl.createProducer(),
//         });
//         return;
//       }

//       console.log("IS A QUEUE");

//       await queueWorker({
//         job,
//         ackDescriptor,
//         producer: owl.createProducer(),
//         queues,
//       });
//     } catch (error) {
//       await owl
//         .createProducer()
//         .acknowledger.reportFailure(ackDescriptor, job, error);
//       console.log(error, "ERROR");

//       if (error instanceof Error) {
//         await log({
//           message: `Error running job ${job.id}`,
//           data: [
//             {
//               name: "Error",
//               value: `\`${error.message}\``,
//             },
//           ],
//           color: "red",
//         });
//       }
//     }
//   });
// }
// export const createOwl = async <T extends string>({
//   cronJobs,
//   queues,
// }: {
//   cronJobs: CronJobs[];
//   queues: Record<T, OwlQueue>;
// }) => {
//   const owlClient = new Owl({
//     redisFactory,
//     logger,
//     onError: (err) => {
//       console.error(err);
//     },
//     scheduleMap: {
//       cron: cronSchedule,
//     },
//   });
//   await owlClient.runMigrations();

//   const redis = redisFactory();
//   const producer = owlClient.createProducer();
//   owlClient.createActivity((event) => {
//     console.log(event);
//   });
//   const worker = await createWorker({
//     redisFactory,
//     logger,
//     onError: (err) => {
//       console.error(err);
//     },
//     scheduleMap: {
//       cron: cronSchedule,
//     },
//   });

//   // setInterval(async () => {
//   //   const items = await redis.zrange("queue", 0, -1, "WITHSCORES");

//   //   const itemsToObject = items.reduce(
//   //     (acc, item, index) => {
//   //       if (index % 2 === 0) {
//   //         acc[item] = items[index + 1]!;
//   //       }
//   //       return acc;
//   //     },
//   //     {} as Record<string, string>,
//   //   );
//   //   logger.trace(itemsToObject, "All items in queue");
//   // }, 500);

//   try {
//     const existingQueues = await redis.smembers(`crons`);
//     const queuesThatShouldPersist = cronJobs.map((cronJob) => cronJob.name);

//     const deleted = new Set<string>();

//     await Promise.all(
//       existingQueues.map(async (queue) => {
//         if (!queuesThatShouldPersist.includes(queue)) {
//           await producer.delete(`cron/${queue}`, "@cron");
//           deleted.add(queue);

//           await redis.srem(`crons`, queue);
//         }
//       }),
//     );

//     await Promise.all(
//       Object.entries(cronJobs).map(async ([_, cronJob]) => {
//         await redis.sadd(`crons`, cronJob.name);
//         const job = await producer.enqueue({
//           id: "@cron",
//           queue: encodeURIComponent(`cron/${cronJob.name}`),
//           override: true,
//           payload: "null",
//           schedule: {
//             type: "cron",
//             meta: cronJob.cron,
//           },

//           runAt: cronParser.parseExpression(cronJob.cron).next().toDate(),
//         });

//         console.log(job, "CRONNED JOB FR FR");
//       }),
//     );

//     console.log("Cron jobs started");
//     console.table(cronJobs.map(({ name, cron }) => ({ name, cron })));

//     await log({
//       message: `Cron jobs started, ${deleted.size} jobs deleted`,
//       data: cronJobs.map(({ name, cron }) => ({
//         name,
//         value: `\`${cron}\``,
//       })),
//       color: "green",
//     });
//   } catch (error) {
//     await worker.close();
//     await producer.close();
//     redis.disconnect();

//     throw error;
//   }

//   return {
//     runJob: async (handler: () => Promise<void>) => {
//       const id = nid();

//       backgroundJobs.set(id, handler);

//       await producer.enqueue({
//         id,
//         queue: "background-job",
//         payload: "",
//       });

//       return id;
//     },
//     enqueue: createQueueProducer(queues, producer),
//     close: async () => {
//       await worker.close();
//       await producer.close();
//       redis.disconnect();
//     },
//   };
// };

// async function cronWorker({
//   job,
//   ackDescriptor,
//   producer,
//   cronJobs,
// }: {
//   job: Job<"cron">;
//   ackDescriptor: AcknowledgementDescriptor;
//   producer: Producer<"cron">;
//   cronJobs: CronJobs[];
// }) {
//   const cronJob = cronJobs.find(
//     (cronJob) => cronJob.name === job.queue.split("%2F")[1],
//   );

//   if (!cronJob) {
//     return;
//   }

//   cronJob.name = decodeURIComponent(cronJob.name);

//   await producer.acknowledger.acknowledge(ackDescriptor);
//   try {
//     await log({
//       message: `Running cron job \`${cronJob.name}\``,
//       data: [
//         {
//           name: "Expression",
//           value: `\`${cronJob.cron}\``,
//         },
//         {
//           name: "Next run",
//           value: `<t:${Math.round(cronParser.parseExpression(cronJob.cron).next().toDate().getTime() / 1000)}:f>`,
//         },
//         {
//           name: "Current run",
//           value: `<t:${Math.round(job.runAt.getTime() / 1000)}:f>`,
//         },
//       ],
//       color: "green",
//     });

//     console.log(`Running cron job ${cronJob.name}`);
//     // await Sentry.withMonitor(
//     //   cronJob.name,
//     //   async () => {
//     await cronJob.handler();
//     //   },
//     //   {
//     //     schedule: {
//     //       type: "crontab",
//     //       value: cronJob.cron,
//     //     },
//     //     checkinMargin: 2,
//     //     maxRuntime: 7,
//     //   },
//     // );

//     console.log(ackDescriptor);
//   } catch (error) {
//     await producer.acknowledger.reportFailure(ackDescriptor, job, error);
//     console.log(error, "ERROR");
//   }

//   return;
// }
// async function queueWorker<T extends string>({
//   job,
//   ackDescriptor,
//   producer,
//   queues,
// }: {
//   job: Job<"cron">;
//   ackDescriptor: AcknowledgementDescriptor;
//   producer: Producer<"cron">;
//   queues: Record<string, OwlQueue>;
// }) {
//   const queue = queues[job.queue as T];

//   if (!queue) {
//     throw new Error(`No queue found for route ${job.queue}`);
//   }

//   try {
//     await queue(superjson.parse(job.payload), job);
//     await producer.acknowledger.acknowledge(ackDescriptor);
//   } catch (error) {
//     await producer.acknowledger.reportFailure(ackDescriptor, job, error);
//     console.log(error, "ERROR");
//   }

//   return;
// }
// async function backgroundJobWorker({
//   job,
//   ackDescriptor,
//   producer,
// }: {
//   job: Job<"cron">;
//   ackDescriptor: AcknowledgementDescriptor;
//   producer: Producer<"cron">;
// }) {
//   const jobFunc = backgroundJobs.get(job.id);

//   if (!jobFunc) {
//     throw new Error(`No job found for id ${job.id}`);
//   }

//   try {
//     await jobFunc().then(async () => {
//       await producer.acknowledger.acknowledge(ackDescriptor);
//     });
//   } catch (error) {
//     await producer.acknowledger.reportFailure(ackDescriptor, job, error);
//     console.log(error, "ERROR");
//   }

//   return;
// }

// function createQueueProducer<T extends Record<string, OwlQueue>>(
//   queues: T,
//   producer: Producer<"cron">,
// ) {
//   return async (
//     queue: keyof typeof queues,
//     data: Omit<JobEnqueue<never>, "queue" | "payload"> & {
//       payload: NonNullable<object>;
//     },
//   ) => {
//     const job = await producer.enqueue({
//       ...data,
//       payload: superjson.stringify(data.payload),
//       queue: String(queue),
//     });

//     return job;
//   };
// }

// type Unpromise<T extends Promise<unknown>> =
//   T extends Promise<infer U> ? U : never;

// const globalForOwl = globalThis as unknown as {
//   owl: Unpromise<ReturnType<typeof createOwl<keyof typeof queues>>> | undefined;
// };

// export const owl =
//   globalForOwl.owl ??
//   (await createOwl({
//     cronJobs,
//     queues,
//   }));

// if (process.env.NODE_ENV !== "production") globalForOwl.owl = owl;
