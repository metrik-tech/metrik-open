import { trace } from "@sentry/bun";
import cuid from "cuid";
import { differenceInMilliseconds } from "date-fns";
import { Elysia, t, type Static } from "elysia";
import { NativeEnum } from "../utils/native-enum";
import { redisFactory } from "../utils/redis";
import { objectSimilarity, stringSimilarity } from "../utils/similarity";
import { z } from "zod";

import {
  Error as DBError,
  ErrorBreadcrumbs,
  ErrorBreadcrumbsTimestamps,
  ErrorEnvironment,
  ErrorPlaceId,
  ErrorPlaceVersion,
  ErrorServerId,
  Issue,
  Prisma,
} from "@metrik/db/client";
import { nid } from "@metrik/id";

import { context } from "../context";
import { MError } from "../utils/error";

const ErrorSchema = t.Object({
  message: t.String(),
  script: t.String(),
  trace: t.String(),
  context: t.Optional(t.Record(t.String(), t.Any())),
  environment: NativeEnum(ErrorEnvironment),
  breadcrumbs: t.Array(
    t.Object({
      message: t.String(),
      timestamp: t.Date(),
    }),
  ),

  ancestors: t.Array(
    t.Object({
      name: t.String(),
      class: t.String(),
    }),
  ),
  serverId: t.Lowercase(t.String()),
  placeId: t.Number(),
  placeVersion: t.Number(),
});

export type ErrorType = Static<typeof ErrorSchema>;

const redis = redisFactory();

export const logsRouter = new Elysia({
  prefix: "/log",
})
  .use(context)
  .post(
    "/error",
    async ({ body, project, prisma }) => {
      await redis.rpush(
        "error-queue",
        JSON.stringify([
          {
            ...body,
            projectId: project.id,
          },
        ]),
      );

      return {
        message: "Queued error",
      };

      // const allIssues = await prisma.issue.findMany({
      //   where: {
      //     projectId: project.id,
      //     resolved: false,
      //   },
      // });

      // let existingIssue: Issue | undefined;

      // const similar = allIssues
      //   .map((issue) => {
      //     const similarity = stringSimilarity(issue.message, body.message);
      //     if (similarity > 0.9) {
      //       console.log(similarity);
      //       return {
      //         similarity,
      //         issue,
      //       };
      //     }
      //     return undefined;
      //   })
      //   .filter((similarity) => similarity !== undefined) as {
      //   similarity: number;
      //   issue: Issue;
      // }[];

      // if (similar.length > 0) {
      //   const mostSimilar = similar.reduce((acc, obj) => {
      //     if (obj.similarity > (acc?.similarity ?? 0)) {
      //       return obj;
      //     }

      //     return acc;
      //   });

      //   existingIssue = mostSimilar.issue;
      // } else if (similar.length === 1) {
      //   existingIssue = similar[0]!.issue;
      // } else {
      //   existingIssue = undefined;
      // }

      // if (existingIssue) {
      //   const matchingError = await prisma.$transaction(async (t) => {
      //     const errors = await t.error.findMany({
      //       where: {
      //         issueId: existingIssue.id,
      //       },
      //       include: {
      //         breadcrumbs: {
      //           include: {
      //             timestamps: true,
      //           },
      //         },
      //         serverIds: true,
      //         placeVersions: true,
      //         placeIds: true,
      //       },
      //     });

      //     const matchingErrors = errors
      //       .map((error) => {
      //         const similarity = stringSimilarity(error.trace, body.trace);
      //         if (similarity > 0.9) {
      //           return {
      //             similarity,
      //             error,
      //           };
      //         }

      //         return undefined;
      //       })
      //       .filter((similarity) => similarity !== undefined) as {
      //       similarity: number;
      //       error: DBError & {
      //         serverIds: ErrorServerId[];
      //         placeVersions: ErrorPlaceVersion[];
      //         placeIds: ErrorPlaceId[];
      //         breadcrumbs: (ErrorBreadcrumbs & {
      //           timestamps: ErrorBreadcrumbsTimestamps[];
      //         })[];
      //       };
      //     }[];

      //     if (matchingErrors.length > 0) {
      //       const mostSimilar = matchingErrors.reduce((acc, obj) => {
      //         if (obj.similarity > (acc?.similarity ?? 0)) {
      //           return obj;
      //         }

      //         return acc;
      //       });

      //       return mostSimilar.error;
      //     } else if (matchingErrors.length === 1) {
      //       return matchingErrors[0]!.error;
      //     } else {
      //       return undefined;
      //     }
      //   });

      //   if (matchingError) {
      //     const breadcrumbsToUpdate = matchingError.breadcrumbs
      //       .filter((breadcrumb) =>
      //         body.breadcrumbs?.some(
      //           (bodyBreadcrumb) =>
      //             bodyBreadcrumb.message === breadcrumb.message,
      //         ),
      //       )
      //       .map((breadcrumb) => {
      //         const bodyBreadcrumb = body.breadcrumbs?.find(
      //           (bodyBreadcrumb) =>
      //             bodyBreadcrumb.message === breadcrumb.message,
      //         );

      //         if (bodyBreadcrumb) {
      //           return {
      //             message: breadcrumb.message,
      //             timestamps: {
      //               create: {
      //                 id: nid(),
      //                 timestamp: new Date(bodyBreadcrumb.timestamp),
      //               },
      //             },
      //           };
      //         }
      //       })
      //       .filter((breadcrumb) => breadcrumb !== undefined);

      //     const breadcrumbsToCreate = body.breadcrumbs
      //       ?.filter(
      //         (bodyBreadcrumb) =>
      //           !matchingError.breadcrumbs.some(
      //             (breadcrumb) => breadcrumb.message === bodyBreadcrumb.message,
      //           ),
      //       )
      //       .map((bodyBreadcrumb) => ({
      //         id: nid(),
      //         message: bodyBreadcrumb.message,
      //         timestamps: {
      //           create: {
      //             id: nid(),
      //             timestamp: new Date(bodyBreadcrumb.timestamp),
      //           },
      //         },
      //       }));

      //     const serverIds = matchingError.serverIds.map((id) => id.serverId);
      //     const placeVersion = matchingError.placeVersions.map(
      //       (pv) => pv.placeVersion,
      //     );
      //     const placeIds = matchingError.placeIds.map((id) => id.placeId);

      //     await prisma.error.update({
      //       where: {
      //         id: existingIssue.id,
      //       },
      //       data: {
      //         occurences: {
      //           increment: 1,
      //         },
      //         context: body.context
      //           ? {
      //               ...(matchingError.context as Prisma.JsonObject),
      //               ...body.context,
      //             }
      //           : undefined,
      //         breadcrumbs: body.breadcrumbs
      //           ? {
      //               updateMany: breadcrumbsToUpdate.length
      //                 ? {
      //                     where: {
      //                       message: {
      //                         in: breadcrumbsToUpdate.map(
      //                           (breadcrumb) => breadcrumb!.message,
      //                         ),
      //                       },
      //                     },
      //                     data: breadcrumbsToUpdate.map((data) => data),
      //                   }
      //                 : undefined,
      //               createMany: breadcrumbsToCreate?.length
      //                 ? {
      //                     data: breadcrumbsToCreate,
      //                   }
      //                 : undefined,
      //             }
      //           : undefined,
      //         serverIds: serverIds.includes(body.serverId)
      //           ? undefined
      //           : {
      //               create: {
      //                 id: nid(),
      //                 serverId: body.serverId,
      //               },
      //             },
      //         placeVersions: placeVersion.includes(String(body.placeVersion))
      //           ? undefined
      //           : {
      //               create: {
      //                 id: nid(),
      //                 placeVersion: String(body.placeVersion),
      //               },
      //             },
      //         placeIds: placeIds.includes(body.placeId)
      //           ? undefined
      //           : {
      //               create: {
      //                 id: nid(),
      //                 placeId: body.placeId,
      //               },
      //             },
      //       },
      //     });

      //     return {
      //       message: "Updated existing error",
      //     };
      //   }

      //   const [existingErrors, usageLimits] = await prisma.$transaction([
      //     prisma.error.count({
      //       where: {
      //         timestamp: {
      //           gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      //         },
      //         issue: {
      //           projectId: project.id,
      //         },
      //       },
      //     }),
      //     prisma.usageLimits.findFirst({
      //       where: {
      //         studioId: project.studio.id,
      //       },
      //     }),
      //   ]);

      //   if (!usageLimits) {
      //     throw new MError({
      //       code: "BAD_REQUEST",
      //       message: "Error resolving usage limits",
      //     });
      //   }

      //   if (existingErrors >= usageLimits?.uniqueIssuesCount) {
      //     throw new MError({
      //       code: "BAD_REQUEST",
      //       message: "Unique error limit reached",
      //     });
      //   }

      //   await prisma.error.create({
      //     data: {
      //       id: nid(),
      //       issueId: existingIssue.id,
      //       trace: body.trace,
      //       script: body.script,
      //       message: body.message,
      //       context: body.context ? body.context : undefined,
      //       breadcrumbs: body.breadcrumbs
      //         ? {
      //             createMany: {
      //               data: body.breadcrumbs.map((breadcrumb) => ({
      //                 id: nid(),
      //                 message: breadcrumb.message,
      //                 timestamps: {
      //                   create: {
      //                     id: nid(),
      //                     timestamp: new Date(breadcrumb.timestamp),
      //                   },
      //                 },
      //               })),
      //             },
      //           }
      //         : undefined,
      //       occurences: 1,
      //       serverIds: {
      //         create: {
      //           id: nid(),
      //           serverId: body.serverId,
      //         },
      //       },
      //       placeVersions: {
      //         create: {
      //           id: nid(),
      //           placeVersion: String(body.placeVersion),
      //         },
      //       },
      //       placeIds: {
      //         create: {
      //           id: nid(),
      //           placeId: body.placeId,
      //         },
      //       },
      //       scriptAncestors: {
      //         createMany: {
      //           data: body.ancestors.map((ancestor) => ({
      //             id: nid(),
      //             name: ancestor.name,
      //             class: ancestor.class,
      //           })),
      //         },
      //       },
      //     },
      //   });

      //   return {
      //     message: "Created new error",
      //   };
      // }

      // await prisma.issue.create({
      //   data: {
      //     id: nid(),
      //     message: body.message,
      //     title: body.message,
      //     errors: {
      //       create: {
      //         id: nid(),
      //         message: body.message,
      //         trace: body.trace,
      //         script: body.script,
      //         context: body.context ? body.context : undefined,
      //         breadcrumbs: body.breadcrumbs
      //           ? {
      //               createMany: {
      //                 data: body.breadcrumbs.map((breadcrumb) => ({
      //                   id: nid(),
      //                   message: breadcrumb.message,
      //                   timestamps: {
      //                     create: {
      //                       id: nid(),
      //                       timestamp: new Date(breadcrumb.timestamp),
      //                     },
      //                   },
      //                 })),
      //               },
      //             }
      //           : undefined,
      //         occurences: 1,
      //         serverIds: {
      //           create: {
      //             id: nid(),
      //             serverId: body.serverId,
      //           },
      //         },
      //         placeVersions: {
      //           create: {
      //             id: nid(),
      //             placeVersion: String(body.placeVersion),
      //           },
      //         },
      //         placeIds: {
      //           create: {
      //             id: nid(),
      //             placeId: body.placeId,
      //           },
      //         },
      //       },
      //     },

      //     projectId: project.id,
      //   },
      // });

      // return {
      //   message: "Created issue",
      // };
    },
    {
      type: "application/json",
      body: ErrorSchema,
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Logs"],
        summary: "Log an error",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  )
  .post(
    "/error/batch",
    async ({ project, prisma, body }) => {
      await redis.rpush(
        "error-queue",
        ...body.items.map((item) =>
          JSON.stringify({ ...item, projectId: project.id }),
        ),
      );

      return {
        message: `Queued ${body.items.length} error${body.items.length > 1 && "s"}`,
      };
      // const allIssues = await prisma.issue.findMany({
      //   where: {
      //     projectId: project.id,
      //     resolved: false,
      //   },
      // });

      // const issueMap = new Map<
      //   string,
      //   { similarity: number; issue: Issue }[]
      // >();

      // for (const item of body.items) {
      //   const similarIssues = allIssues
      //     .map((issue) => {
      //       const similarity = stringSimilarity(issue.message, item.message);
      //       return similarity > 0.9 ? { similarity, issue } : undefined;
      //     })
      //     .filter((similarity) => similarity !== undefined) as {
      //     similarity: number;
      //     issue: Issue;
      //   }[];

      //   issueMap.set(item.message, similarIssues);
      // }

      // return await prisma.$transaction(async (t) => {
      //   for (const item of body.items) {
      //     const similarIssues = issueMap.get(item.message) ?? [];
      //     let existingIssue: Issue | undefined;

      //     if (similarIssues.length > 0) {
      //       existingIssue = similarIssues.reduce((acc, obj) =>
      //         obj.similarity > (acc?.similarity ?? 0) ? obj : acc,
      //       ).issue;
      //     }

      //     if (existingIssue) {
      //       const errors = await t.error.findMany({
      //         where: {
      //           issueId: existingIssue.id,
      //         },
      //         include: {
      //           breadcrumbs: {
      //             include: {
      //               timestamps: true,
      //             },
      //           },
      //           serverIds: true,
      //           placeVersions: true,
      //           placeIds: true,
      //         },
      //       });

      //       const matchingErrors = errors
      //         .map((error) => {
      //           const similarity = stringSimilarity(error.trace, item.trace);
      //           return similarity > 0.9 ? { similarity, error } : undefined;
      //         })
      //         .filter((similarity) => similarity !== undefined) as {
      //         similarity: number;
      //         error: DBError & {
      //           serverIds: ErrorServerId[];
      //           placeVersions: ErrorPlaceVersion[];
      //           placeIds: ErrorPlaceId[];
      //           breadcrumbs: (ErrorBreadcrumbs & {
      //             timestamps: ErrorBreadcrumbsTimestamps[];
      //           })[];
      //         };
      //       }[];

      //       const matchingError =
      //         matchingErrors.length > 0
      //           ? matchingErrors.reduce((acc, obj) =>
      //               obj.similarity > (acc?.similarity ?? 0) ? obj : acc,
      //             ).error
      //           : undefined;

      //       if (matchingError) {
      //         const breadcrumbsToUpdate = matchingError.breadcrumbs
      //           .filter((breadcrumb) =>
      //             item.breadcrumbs?.some(
      //               (bodyBreadcrumb) =>
      //                 bodyBreadcrumb.message === breadcrumb.message,
      //             ),
      //           )
      //           .map((breadcrumb) => {
      //             const bodyBreadcrumb = item.breadcrumbs?.find(
      //               (bodyBreadcrumb) =>
      //                 bodyBreadcrumb.message === breadcrumb.message,
      //             );
      //             return {
      //               message: breadcrumb.message,
      //               timestamps: {
      //                 create: {
      //                   id: nid(),
      //                   timestamp: new Date(bodyBreadcrumb!.timestamp),
      //                 },
      //               },
      //             };
      //           });

      //         const breadcrumbsToCreate = item.breadcrumbs
      //           ?.filter(
      //             (bodyBreadcrumb) =>
      //               !matchingError.breadcrumbs.some(
      //                 (breadcrumb) =>
      //                   breadcrumb.message === bodyBreadcrumb.message,
      //               ),
      //           )
      //           .map((bodyBreadcrumb) => ({
      //             id: nid(),
      //             message: bodyBreadcrumb.message,
      //             timestamps: {
      //               create: {
      //                 id: nid(),
      //                 timestamp: new Date(bodyBreadcrumb.timestamp),
      //               },
      //             },
      //           }));

      //         const serverIds = matchingError.serverIds.map(
      //           (id) => id.serverId,
      //         );
      //         const placeVersions = matchingError.placeVersions.map(
      //           (pv) => pv.placeVersion,
      //         );
      //         const placeIds = matchingError.placeIds.map((id) => id.placeId);

      //         await t.error.update({
      //           where: {
      //             id: matchingError.id,
      //           },
      //           data: {
      //             occurences: {
      //               increment: 1,
      //             },
      //             context: item.context
      //               ? {
      //                   ...(matchingError.context as Prisma.JsonObject),
      //                   ...item.context,
      //                 }
      //               : undefined,
      //             breadcrumbs: item.breadcrumbs
      //               ? {
      //                   updateMany: breadcrumbsToUpdate.length
      //                     ? {
      //                         where: {
      //                           message: {
      //                             in: breadcrumbsToUpdate.map(
      //                               (breadcrumb) => breadcrumb.message,
      //                             ),
      //                           },
      //                         },
      //                         data: breadcrumbsToUpdate,
      //                       }
      //                     : undefined,
      //                   createMany: breadcrumbsToCreate?.length
      //                     ? {
      //                         data: breadcrumbsToCreate,
      //                       }
      //                     : undefined,
      //                 }
      //               : undefined,
      //             serverIds: serverIds.includes(item.serverId)
      //               ? undefined
      //               : {
      //                   create: {
      //                     id: nid(),
      //                     serverId: item.serverId,
      //                   },
      //                 },
      //             placeVersions: placeVersions.includes(
      //               String(item.placeVersion),
      //             )
      //               ? undefined
      //               : {
      //                   create: {
      //                     id: nid(),
      //                     placeVersion: String(item.placeVersion),
      //                   },
      //                 },
      //             placeIds: placeIds.includes(item.placeId)
      //               ? undefined
      //               : {
      //                   create: {
      //                     id: nid(),
      //                     placeId: item.placeId,
      //                   },
      //                 },
      //           },
      //         });

      //         return {
      //           message: "Updated existing error",
      //         };
      //       }

      //       const [existingErrors, usageLimits] = await Promise.all([
      //         t.error.count({
      //           where: {
      //             timestamp: {
      //               gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      //             },
      //             issue: {
      //               projectId: project.id,
      //             },
      //           },
      //         }),
      //         t.usageLimits.findFirst({
      //           where: {
      //             studioId: project.studio.id,
      //           },
      //         }),
      //       ]);

      //       if (!usageLimits) {
      //         throw new Error("Error resolving usage limits");
      //       }

      //       if (existingErrors >= usageLimits.uniqueIssuesCount) {
      //         throw new Error("Unique error limit reached");
      //       }

      //       await t.error.create({
      //         data: {
      //           id: nid(),
      //           issueId: existingIssue.id,
      //           trace: item.trace,
      //           script: item.script,
      //           message: item.message,
      //           context: item.context,
      //           breadcrumbs: item.breadcrumbs
      //             ? {
      //                 createMany: {
      //                   data: item.breadcrumbs.map((breadcrumb) => ({
      //                     id: nid(),
      //                     message: breadcrumb.message,
      //                     timestamps: {
      //                       create: {
      //                         id: nid(),
      //                         timestamp: new Date(breadcrumb.timestamp),
      //                       },
      //                     },
      //                   })),
      //                 },
      //               }
      //             : undefined,
      //           occurences: 1,
      //           serverIds: {
      //             create: {
      //               id: nid(),
      //               serverId: item.serverId,
      //             },
      //           },
      //           placeVersions: {
      //             create: {
      //               id: nid(),
      //               placeVersion: String(item.placeVersion),
      //             },
      //           },
      //           placeIds: {
      //             create: {
      //               id: nid(),
      //               placeId: item.placeId,
      //             },
      //           },
      //           scriptAncestors: {
      //             createMany: {
      //               data: item.ancestors.map((ancestor) => ({
      //                 id: nid(),
      //                 name: ancestor.name,
      //                 class: ancestor.class,
      //               })),
      //             },
      //           },
      //         },
      //       });

      //       return {
      //         message: "Created new error",
      //       };
      //     } else {
      //       await t.issue.create({
      //         data: {
      //           id: nid(),
      //           message: item.message,
      //           title: item.message,
      //           errors: {
      //             create: {
      //               id: nid(),
      //               message: item.message,
      //               trace: item.trace,
      //               script: item.script,
      //               context: item.context,
      //               breadcrumbs: item.breadcrumbs
      //                 ? {
      //                     createMany: {
      //                       data: item.breadcrumbs.map((breadcrumb) => ({
      //                         id: nid(),
      //                         message: breadcrumb.message,
      //                         timestamps: {
      //                           create: {
      //                             id: nid(),
      //                             timestamp: new Date(breadcrumb.timestamp),
      //                           },
      //                         },
      //                       })),
      //                     },
      //                   }
      //                 : undefined,
      //               occurences: 1,
      //               serverIds: {
      //                 create: {
      //                   id: nid(),
      //                   serverId: item.serverId,
      //                 },
      //               },
      //               placeVersions: {
      //                 create: {
      //                   id: nid(),
      //                   placeVersion: String(item.placeVersion),
      //                 },
      //               },
      //               placeIds: {
      //                 create: {
      //                   id: nid(),
      //                   placeId: item.placeId,
      //                 },
      //               },
      //             },
      //           },
      //           projectId: project.id,
      //         },
      //       });

      //       return {
      //         message: "Created issue",
      //       };
      //     }
      //   }

      //   return {
      //     message: "Created issue",
      //   };
      // });
    },
    {
      type: "application/json",
      body: t.Object({
        items: t.Array(ErrorSchema),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Logs"],
        summary: "Log multiple errors",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  );
