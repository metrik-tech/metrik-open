import { prisma } from "@metrik/db";
import { ActionRunDetailType, ActionRunStatus } from "@metrik/db/client";
import { nid } from "@metrik/id";

// import { type OwlQueue } from "./owl";
import { createBackgroundJobClient, createQueues } from "./utils/queue";

export const queues = createQueues({
  actionJanitor: async (payload, job) => {
    const { runId } = payload as { runId: string };

    const run = await prisma.actionRun.findFirst({
      where: {
        id: runId,
        claimantServerId: null,
        status: ActionRunStatus.PENDING,
        exclusive: true,
      },
      include: {
        details: true,
      },
    });

    if (!run) {
      return;
    }

    await prisma.actionRun.update({
      where: {
        id: run.id,
      },
      data: {
        status: ActionRunStatus.FAILED,
        details: {
          create: {
            id: nid(),
            type: ActionRunDetailType.FAILED,
            content: {
              message: "Run timed out. No server claimed the run.",
            },
          },
        },
      },
    });
  },
  updateLastUsed: async (payload, job) => {
    const { timestamp, tokenId } = payload as {
      timestamp: Date;
      tokenId: string;
    };

    await prisma.token.update({
      where: {
        id: tokenId,
      },
      data: {
        lastUsed: timestamp,
      },
    });
  },
}) 

export const backgroundJobs = createBackgroundJobClient();
