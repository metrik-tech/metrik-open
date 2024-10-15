import Owl, { type JobEnqueue } from "@quirrel/owl";
import type { Producer } from "@quirrel/owl/dist/producer/producer";
import consola from "consola";
import cuid from "cuid";
import Redis from "ioredis";
import pino from "pino";
import superjson from "superjson";

import { nid } from "@metrik/id";

import { cronSchedule } from "../cron";
import { redisFactory } from "./redis";

export const owl = new Owl({
  redisFactory,
  scheduleMap: {
    cron: cronSchedule,
  },
  logger: pino(),
  onError: (error) => {
    console.log(error);
  },
});

interface QueueFunctionParams {
  queue: string;
  options?: {
    runAt?: Date;
    exclusive?: boolean;
    override?: boolean;
    retry?: number[];
  };
}

type QueueFunction = (
  payload: unknown,
  job: QueueFunctionParams,
) => Promise<void> | void;

type TypedQueueFunction<T> = (
  payload: T,
  job: QueueFunctionParams,
) => Promise<void>;

const backgroundJobs = new Map<string, () => Promise<void>>();

export async function createBackgroundJobClient() {
  const producer = owl.createProducer();

  const worker = await owl.createWorker(async (job, ackDescriptor) => {
    if (job.id === "@cron") {
      return;
    }

    const jobFunc = backgroundJobs.get(job.id);

    if (!jobFunc) {
      throw new Error(`No job found for id ${job.id}`);
    }

    try {
      await jobFunc().then(async () => {
        await producer.acknowledger.acknowledge(ackDescriptor);
      });
    } catch (error) {
      await producer.acknowledger.reportFailure(ackDescriptor, job, error);
      console.log(error, "ERROR");
    }

    return;
  });

  return {
    backgroundJob: async (func: () => Promise<void>) => {
      const id = nid();
      backgroundJobs.set(id, func);

      await producer.enqueue({
        id,
        queue: "background-job",
        payload: "",
      });

      return id;
    },
    close: async () => {
      await producer.close();
      await worker.close();
    },
  };
}

export async function createQueue<T>(
  name: string,
  queue: TypedQueueFunction<T>,
) {
  const producer = owl.createProducer();

  const worker = await owl.createWorker(async (job, ackDescriptor) => {
    try {
      await queue(superjson.parse(job.payload), job).then(async () => {
        await producer.acknowledger.acknowledge(ackDescriptor);
      });
    } catch (error) {
      await producer.acknowledger.reportFailure(ackDescriptor, job, error);
      console.log(error, "ERROR");
    }

    return;
  });

  return {
    enqueue: async (
      payload: Parameters<typeof queue>[0],
      options?: QueueFunctionParams["options"],
    ) => {
      const job = await producer.enqueue({
        payload: superjson.stringify(payload),
        queue: name,
        ...options,

        id: nid(),
      });

      return job;
    },
    close: async () => {
      await worker.close();
      await producer.close();
    },
  };
}

export async function createQueues<T extends string>(
  queues: Record<T, QueueFunction>,
) {
  const producer = owl.createProducer();

  const worker = await owl.createWorker(async (job, ackDescriptor) => {
    if (job.queue === "background-job" || job.id === "@cron") {
      return;
    }

    const queue = queues[job.queue as T];

    if (!queue) {
      throw new Error(`No queue found for route ${job.queue}`);
    }

    try {
      await queue(superjson.parse(job.payload), job);
      await producer.acknowledger.acknowledge(ackDescriptor);
    } catch (error) {
      await producer.acknowledger.reportFailure(ackDescriptor, job, error);
      console.log(error, "ERROR");
    }

    return;
  });

  return {
    enqueue: createProducer<typeof queues>(queues, producer),
    close: async () => {
      await worker.close();
      await producer.close();
    },
  };
}

export function createProducer<T extends Record<string, QueueFunction>>(
  queues: T,
  producer: Producer<"cron">,
) {
  return async (
    queue: keyof typeof queues,
    data: Omit<JobEnqueue<never>, "queue" | "payload"> & {
      payload: NonNullable<object>;
    },
  ) => {
    const job = await producer.enqueue({
      ...data,
      payload: superjson.stringify(data.payload),
      queue: String(queue),
    });

    return job;
  };
}

// const { enqueue, close } = await createQueues({
//   publishAction: (payload, job) => {
//     const { id } = payload as { id: string };
//     console.log(id, "asdads");
//     // ...
//   },
//   runAction: (payload, job) => {
//     const { id } = payload as { id: string };
//     console.log(id, "asdads");
//     // ...
//     // ...
//   },
//   a: () => {
//     console.log("a");
//   },
// });

// owl
//   .createWorker(async (job) => {
//     console.log("Delay: ", Date.now() - +job.payload);
//   })
//   .then((worker) => {
//     process.on("SIGINT", () => worker.close());
//   });

// async function main() {
//   const producer = owl.createProducer();

//   for (let i = 0; i < 100; i++) {
//     console.log("enq", Date.now());
//     await producer.enqueue({
//       id: "hallo-" + i,
//       queue: "hallo",
//       payload: "" + Date.now(),
//     });
//   }

//   producer.close();
// }

// main();

// const promises = [];

// for (let i = 1; i < 101; i++) {
//   promises.push(
//     enqueue("runAction", {
//       id: cuid(),
//       override: true,
//       payload: {
//         id: i,
//       },
//     }),
//   );
// }

// await Promise.all(promises);

// process.on("SIGINT", async () => {
//   await close();
// });

// process.on("SIGTERM", async () => {
//   await close();
// });
