/* eslint-disable @typescript-eslint/no-explicit-any */
import pLimit from "p-limit";
import { CronJob as QuirrelJob } from "quirrel/next-app";

import { prisma } from "@metrik/db";
import {
  type Error as DBError,
  type ErrorBreadcrumbs,
  type ErrorBreadcrumbsTimestamps,
  type ErrorPlaceId,
  type ErrorPlaceVersion,
  type ErrorServerId,
  type Issue,
  type Prisma,
} from "@metrik/db/client";
import { prisma as replica } from "@metrik/db/replica";
import { nid } from "@metrik/id";

import { type ErrorType } from "../routers/logs";
import { CronJob } from "../utils/cron";
import { log } from "../utils/discord";
import { redisFactory } from "../utils/redis";
import { stringSimilarity } from "../utils/similarity";

const redis = redisFactory();
const limit = pLimit(5);

export const errorQueueJob = CronJob(
  "jobs/error-queue",
  "*/2 * * * *",
  async () => {
    const queue = await redis.lrange("error-queue", 0, -1);
    const decoded = new Set(
      queue
        .map(
          (item) => JSON.parse(item) as (ErrorType & { projectId: string })[],
        )
        .flat(),
    );
    await redis.del("error-queue");

    const allIssues = await replica.issue.findMany({
      where: {
        projectId: {
          in: Array.from(decoded.values()).map((item) => item.projectId),
        },
        resolved: false,
      },
    });

    const issueMap = new Map<string, { similarity: number; issue: Issue }[]>();

    for (const item of decoded) {
      const similarIssues = allIssues
        .map((issue) => {
          const similarity = stringSimilarity(issue.message, item.message);
          return similarity > 0.9 ? { similarity, issue } : undefined;
        })
        .filter((similarity) => similarity !== undefined) as {
        similarity: number;
        issue: Issue;
      }[];

      issueMap.set(item.message, similarIssues);
    }

    const updateErrorQueue = new Set<Promise<any>>();
    const createIssueQueue = new Set<Promise<any>>();
    const createErrorQueue = new Set<Promise<any>>();

    try {
      await Promise.all(
        Array.from(decoded).map(async (item) => {
          const similarIssues = issueMap.get(item.message) ?? [];
          let existingIssue: Issue | undefined;

          if (similarIssues.length > 0) {
            existingIssue = similarIssues.reduce((acc, obj) =>
              obj.similarity > (acc?.similarity ?? 0) ? obj : acc,
            ).issue;
          }

          if (existingIssue) {
            const errors = await replica.error.findMany({
              where: {
                issueId: existingIssue.id,
              },
              include: {
                breadcrumbs: {
                  include: {
                    timestamps: true,
                  },
                },
                serverIds: true,
                placeVersions: true,
                placeIds: true,
              },
            });

            const matchingErrors = errors
              .map((error) => {
                const similarity = stringSimilarity(error.trace, item.trace);
                return similarity > 0.9 ? { similarity, error } : undefined;
              })
              .filter((similarity) => similarity !== undefined) as {
              similarity: number;
              error: DBError & {
                serverIds: ErrorServerId[];
                placeVersions: ErrorPlaceVersion[];
                placeIds: ErrorPlaceId[];
                breadcrumbs: (ErrorBreadcrumbs & {
                  timestamps: ErrorBreadcrumbsTimestamps[];
                })[];
              };
            }[];

            const matchingError =
              matchingErrors.length > 0
                ? matchingErrors.reduce((acc, obj) =>
                    obj.similarity > (acc?.similarity ?? 0) ? obj : acc,
                  ).error
                : undefined;

            if (matchingError) {
              const breadcrumbsToUpdate = matchingError.breadcrumbs
                .filter((breadcrumb) =>
                  item.breadcrumbs.some(
                    (bodyBreadcrumb) =>
                      bodyBreadcrumb.message === breadcrumb.message,
                  ),
                )
                .map((breadcrumb) => {
                  const bodyBreadcrumb = item.breadcrumbs.find(
                    (bodyBreadcrumb) =>
                      bodyBreadcrumb.message === breadcrumb.message,
                  );
                  return {
                    message: breadcrumb.message,
                    timestamps: {
                      create: {
                        id: nid(),
                        timestamp: new Date(bodyBreadcrumb!.timestamp),
                      },
                    },
                  };
                });

              const breadcrumbsToCreate = item.breadcrumbs
                .filter(
                  (bodyBreadcrumb) =>
                    !matchingError.breadcrumbs.some(
                      (breadcrumb) =>
                        breadcrumb.message === bodyBreadcrumb.message,
                    ),
                )
                .map((bodyBreadcrumb) => ({
                  id: nid(),
                  message: bodyBreadcrumb.message,
                  timestamps: {
                    create: {
                      id: nid(),
                      timestamp: new Date(bodyBreadcrumb.timestamp),
                    },
                  },
                }));

              const serverIds = matchingError.serverIds.map(
                (id) => id.serverId,
              );
              const placeVersions = matchingError.placeVersions.map(
                (pv) => pv.placeVersion,
              );
              const placeIds = matchingError.placeIds.map((id) => id.placeId);

              updateErrorQueue.add(
                prisma.error.update({
                  where: {
                    id: matchingError.id,
                  },
                  data: {
                    occurences: {
                      increment: 1,
                    },
                    context: item.context
                      ? {
                          ...(matchingError.context as Prisma.JsonObject),
                          ...item.context,
                        }
                      : undefined,
                    breadcrumbs: {
                      updateMany: breadcrumbsToUpdate.length
                        ? {
                            where: {
                              message: {
                                in: breadcrumbsToUpdate.map(
                                  (breadcrumb) => breadcrumb.message,
                                ),
                              },
                            },
                            data: breadcrumbsToUpdate,
                          }
                        : undefined,
                      createMany: breadcrumbsToCreate?.length
                        ? {
                            data: breadcrumbsToCreate,
                          }
                        : undefined,
                    },
                    serverIds: serverIds.includes(item.serverId)
                      ? undefined
                      : {
                          create: {
                            id: nid(),
                            serverId: item.serverId,
                          },
                        },
                    placeVersions: placeVersions.includes(
                      String(item.placeVersion),
                    )
                      ? undefined
                      : {
                          create: {
                            id: nid(),
                            placeVersion: String(item.placeVersion),
                          },
                        },
                    placeIds: placeIds.includes(String(item.placeId))
                      ? undefined
                      : {
                          create: {
                            id: nid(),
                            placeId: String(item.placeId),
                          },
                        },
                  },
                }),
              );

              return {
                message: "Updated existing error",
              };
            }

            const [existingErrors, usageLimits] = await Promise.all([
              replica.error.count({
                where: {
                  timestamp: {
                    gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
                  },
                  issue: {
                    projectId: item.projectId,
                  },
                },
              }),
              replica.usageLimits.findFirst({
                where: {
                  studio: {
                    projects: {
                      some: {
                        id: item.projectId,
                      },
                    },
                  },
                },
              }),
            ]);

            if (!usageLimits) {
              throw new Error("Error resolving usage limits");
            }

            if (existingErrors >= usageLimits.uniqueIssuesCount) {
              throw new Error("Unique error limit reached");
            }

            createErrorQueue.add(
              prisma.error.create({
                data: {
                  id: nid(),
                  environment: item.environment,
                  issueId: existingIssue.id,
                  trace: item.trace,
                  script: item.script,
                  message: item.message,
                  context: item.context,
                  breadcrumbs: item.breadcrumbs
                    ? {
                        createMany: {
                          data: item.breadcrumbs.map((breadcrumb) => ({
                            id: nid(),
                            message: breadcrumb.message,
                            timestamps: {
                              create: {
                                id: nid(),
                                timestamp: new Date(breadcrumb.timestamp),
                              },
                            },
                          })),
                        },
                      }
                    : undefined,
                  occurences: 1,
                  serverIds: {
                    create: {
                      id: nid(),
                      serverId: item.serverId,
                    },
                  },
                  placeVersions: {
                    create: {
                      id: nid(),
                      placeVersion: String(item.placeVersion),
                    },
                  },
                  placeIds: {
                    create: {
                      id: nid(),
                      placeId: String(item.placeId),
                    },
                  },
                  scriptAncestors: {
                    createMany: {
                      data: item.ancestors.map((ancestor) => ({
                        id: nid(),
                        name: ancestor.name,
                        class: ancestor.class,
                      })),
                    },
                  },
                },
              }),
            );

            return {
              message: "Created new error",
            };
          } else {
            createIssueQueue.add(
              replica.issue.create({
                data: {
                  id: nid(),
                  message: item.message,
                  title: item.message,
                  errors: {
                    create: {
                      environment: item.environment,
                      id: nid(),
                      message: item.message,
                      trace: item.trace,
                      script: item.script,
                      context: item.context,
                      breadcrumbs: item.breadcrumbs
                        ? {
                            createMany: {
                              data: item.breadcrumbs.map((breadcrumb) => ({
                                id: nid(),
                                message: breadcrumb.message,
                                timestamps: {
                                  create: {
                                    id: nid(),
                                    timestamp: new Date(breadcrumb.timestamp),
                                  },
                                },
                              })),
                            },
                          }
                        : undefined,
                      occurences: 1,
                      serverIds: {
                        create: {
                          id: nid(),
                          serverId: item.serverId,
                        },
                      },
                      placeVersions: {
                        create: {
                          id: nid(),
                          placeVersion: String(item.placeVersion),
                        },
                      },
                      placeIds: {
                        create: {
                          id: nid(),
                          placeId: String(item.placeId),
                        },
                      },
                    },
                  },
                  projectId: item.projectId,
                },
              }),
            );

            return {
              message: "Created issue",
            };
          }
        }),
      );

      await Promise.all(
        [...updateErrorQueue, ...createIssueQueue, ...createErrorQueue].map(
          (p) => limit(() => p),
        ),
      );
    } catch (error) {
      if (error instanceof Error) {
        await log({
          message: "Error while processing error queue",
          data: [
            {
              name: "Error",
              value: `\`\`\`\n${error.message}\n\`\`\``,
            },
          ],
          color: "red",
        });
      }
    }
  },
);
