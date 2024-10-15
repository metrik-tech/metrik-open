import cuid from "cuid";
import { addMinutes } from "date-fns";
import { Elysia, t, type Context } from "elysia";
import { z } from "zod";

import { prisma } from "@metrik/db";
import {
  ActionArgumentType,
  ActionRunDetailType,
  ActionRunStatus,
  type Action,
  type ActionRunArguments,
  type Prisma,
} from "@metrik/db/client";
import { nid } from "@metrik/id";

import { context } from "../context";
import { robloxOnly, robloxRestricted } from "../procedures";
import { ErrorSchema, MError } from "../utils/error";
import { NativeEnum } from "../utils/native-enum";
import { createQueue } from "../utils/queue";

// function isServerIdBehaviour(behaviour: ActionRunBehaviour) {
//   return ["SELECTED_SERVER", "SELECTED_SERVERS"].includes(behaviour);
// }

// function isPlaceVersionBehaviour(behaviour: ActionRunBehaviour) {
//   return ["SELECTED_PLACE_VERSION", "SELECTED_PLACE_VERSIONS"].includes(
//     behaviour,
//   );
// }

export const actionsRouter = new Elysia({
  prefix: "/actions",
})
  .use(context)
  .post(
    "/register",
    async ({ prisma, project, body, ...ctx }) => {
      robloxRestricted(ctx.request.headers, ctx.userId, ctx.request.url);

      // if (body.key.startsWith("internal:")) {
      //   return { message: "Action registered" };
      // }

      const server = await prisma.activeServer.findFirst({
        where: {
          serverId: body.serverId,
          projectId: project.id,
        },
      });

      if (!server) {
        throw new MError({
          message: "Server not found",
          code: "NOT_FOUND",
        });
      }

      const existingAction = await prisma.action.findFirst({
        where: {
          key: body.key,
          projectId: project.id,
          placeVersion: body.placeVersion,
        },
        include: {
          arguments: true,
        },
      });

      let action: Action | undefined;

      if (existingAction) {
        if (
          (existingAction.serverIds as string[]).some(
            (serverId) => serverId === server.serverId,
          )
        ) {
          throw new MError({
            message: "Action already registered",
            code: "BAD_REQUEST",
          });
        }

        action = await prisma.action.update({
          where: {
            id: existingAction.id,
          },
          data: {
            name: body.name,
            arguments:
              body.arguments && existingAction?.arguments
                ? {
                    createMany: {
                      data: body.arguments.map((arg) => ({
                        id: nid(),
                        ...arg,
                      })),
                    },
                    deleteMany: {
                      id: {
                        in: existingAction?.arguments.map((arg) => arg.id),
                      },
                    },
                  }
                : body.arguments
                  ? {
                      createMany: {
                        data: body.arguments.map((arg) => ({
                          id: nid(),
                          ...arg,
                        })),
                      },
                    }
                  : existingAction?.arguments
                    ? {
                        deleteMany: {
                          id: {
                            in: existingAction?.arguments.map((arg) => arg.id),
                          },
                        },
                      }
                    : undefined,

            // placeVersions: {
            //   create: existingAction?.placeVersions.find(
            //     (pv) => pv.placeVersion === String(body.placeVersion),
            //   )
            //     ? undefined
            //     : {
            //         id: nid(),
            //         placeVersion: String(body.placeVersion),
            //       },
            // },
            serverIds: [...existingAction.serverIds, body.serverId],
          },
        });
      } else {
        action = await prisma.action.create({
          data: {
            id: nid(),
            key: body.key,
            name: body.name,
            description: body.description,
            placeVersion: body.placeVersion,
            placeId: String(body.placeId),
            arguments: body.arguments
              ? {
                  createMany: {
                    data: body.arguments.map((arg) => ({
                      id: nid(),
                      ...arg,
                    })),
                  },
                }
              : undefined,
            serverIds: [body.serverId],
            projectId: project.id,
          },
        });
      }

      const existingActionsCount = await prisma.action.count({
        where: {
          projectId: project.id,
        },
      });

      if (existingActionsCount >= 500 && action.id !== existingAction?.id) {
        throw new MError({
          message: "Hard action limit reached (500)",
          code: "BAD_REQUEST",
        });
      }

      return { message: "Action registered" };
    },

    {
      detail: {
        tags: ["Actions"],
        summary: "Register Action",
        security: [
          {
            Token: [],
          },
        ],
      },

      type: "application/json",
      body: t.Object({
        serverId: t.Lowercase(t.String()),
        key: t.String(),
        name: t.String(),
        placeVersion: t.Number(),
        placeId: t.Number(),
        description: t.Optional(
          t.String({
            maxLength: 500,
          }),
        ),
        arguments: t.Optional(
          t.Array(
            t.Object({
              type: NativeEnum(ActionArgumentType),
              name: t.String(),
              description: t.Optional(
                t.String({
                  maxLength: 200,
                }),
              ),
              required: t.Boolean(),
              default: t.Optional(t.String()),
            }),
            {
              maxItems: 5,
            },
          ),
        ),
      }),

      response: t.Object({
        message: t.String(),
      }),
    },
  )
  .post(
    "/run",
    async ({ prisma, project, body, openCloud, queues }) => {
      const [usageLimits, runCount, action] = await prisma.$transaction([
        prisma.usageLimits.findFirst({
          where: {
            studioId: project.studio.id,
          },
        }),
        prisma.actionRun.count({
          where: {
            projectId: project.id,
            timestamp: {
              gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 1 month
            },
          },
        }),
        prisma.action.findFirst({
          where: {
            key: body.key,
            projectId: project.id,
            placeId: String(body.placeId),
            placeVersion: body.version,
          },
          include: {
            arguments: true,
          },
        }),
      ]);

      if (!usageLimits) {
        throw new MError({
          message: "Usage limit not found",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      if (runCount >= usageLimits.actionRunsCount) {
        throw new MError({
          message: "Usage limit reached",
          code: "BAD_REQUEST",
        });
      }

      if (!action) {
        throw new MError({
          message: "Action not found",
          code: "NOT_FOUND",
        });
      }

      // if (
      //   ["ALL_SERVERS", "RANDOM_SERVER"].includes(body.behaviour) &&
      //   body.serverIds?.length
      // ) {
      //   throw new MError({
      //     message:
      //       "Invalid behaviour. Cannot specify `serverIds` with behaviour ALL_SERVERS or RANDOM_SERVER.",
      //     code: "BAD_REQUEST",
      //   });
      // }

      // switch (body.behaviour) {
      //   case "SELECTED_SERVER":
      //     if (body.serverIds?.length !== 1) {
      //       throw new MError({
      //         message:
      //           "Invalid behaviour. Expected 1 `serverId` with behaviour SELECTED_SERVER.",
      //         code: "BAD_REQUEST",
      //       });
      //     }
      //     break;
      //   // case "SELECTED_PLACE_VERSION":
      //   //   if (
      //   //     body.placeVersions?.length !== 1 ||
      //   //     body.serverIds?.length !== 0
      //   //   ) {
      //   //     throw new MError({
      //   //       message: "Invalid behaviour",
      //   //       code: "BAD_REQUEST",
      //   //     });
      //   //   }
      //   //   break;
      //   case "SELECTED_SERVERS":
      //     if (body.serverIds?.length === 0) {
      //       throw new MError({
      //         message:
      //           "Invalid behaviour. Expected at least 1 `serverId` with behaviour SELECTED_SERVERS.",
      //         code: "BAD_REQUEST",
      //       });
      //     }
      //     break;
      //   // case "SELECTED_PLACE_VERSIONS":
      //   //   if (
      //   //     body.placeVersions?.length === 0 ||
      //   //     body.serverIds?.length !== 0
      //   //   ) {
      //   //     throw new MError({
      //   //       message: "Invalid behaviour",
      //   //       code: "BAD_REQUEST",
      //   //     });
      //   //   }
      //   //   break;
      //   default:
      //     break;
      // }

      const args = new Set<{
        name: string;
        type: ActionArgumentType;
        value: string;
        array: boolean;
      }>();

      const regexes = {
        [ActionArgumentType.STRING]: /^.{0,512}$/,
        [ActionArgumentType.NUMBER]: /^\d+$/,
        [ActionArgumentType.BOOLEAN]: /^(true|false)$/i,
        [ActionArgumentType.PLAYER]: /^\d+$/,
        [ActionArgumentType.USER]: /^\d+$/,
      };

      if (action.arguments.length) {
        const inputArgs = body.arguments?.map((arg) => arg.name) ?? [];

        action.arguments.forEach((arg) => {
          if (!arg.required && !arg.default && !inputArgs.includes(arg.name)) {
            return;
          }

          if (arg.array) {
            const inputArg = body.arguments?.find(
              (inputArg) => inputArg.name === arg.name,
            );

            if (arg.required && !inputArg!.value && !arg.default) {
              throw new MError({
                message: `Invalid array argument ${arg.name}. Expected an array of \`${arg.type}\`.`,
                code: "BAD_REQUEST",
              });
            }

            const decoded = JSON.parse(inputArg!.value) as string[];

            if (!(decoded instanceof Array)) {
              throw new MError({
                message: `Invalid array argument ${arg.name}. Expected an array of \`${arg.type}\`.`,
                code: "BAD_REQUEST",
              });
            }

            decoded.forEach((value, index) => {
              if (!regexes[arg.type].test(value)) {
                throw new MError({
                  message: `Invalid array type on argument ${arg.name}, index ${index}, expected \`${arg.type}\`.`,
                  code: "BAD_REQUEST",
                });
              }
            });

            if (!inputArg!.value && arg.default) {
              args.add({
                name: arg.name,
                type: arg.type,
                value: arg.default,
                array: true,
              });
            }

            args.add({
              name: arg.name,
              type: arg.type,
              value: inputArg!.value,
              array: true,
            });
          } else if (!arg.array) {
            if (
              inputArgs.includes(arg.name) &&
              !regexes[arg.type].test(
                body.arguments?.find((a) => a.name === arg.name)?.value ?? "",
              )
            ) {
              throw new MError({
                message: `Invalid arguments type, expected \`${arg.type}\`.`,
                code: "BAD_REQUEST",
              });
            }

            if (arg.required && !arg.default && !inputArgs.includes(arg.name)) {
              throw new MError({
                message: `Invalid arguments. Missing required argument \`${arg.name}\`.`,
                code: "BAD_REQUEST",
              });
            }

            if (arg.default && !inputArgs.includes(arg.name)) {
              args.add({
                name: arg.name,
                type: arg.type,
                value: arg.default,
                array: false,
              });
            } else if (
              inputArgs.includes(arg.name) &&
              body.arguments?.find((inputArg) => inputArg.name === arg.name)
            ) {
              args.add(
                body.arguments?.find(
                  (inputArg) => inputArg.name === arg.name,
                ) as {
                  name: string;
                  type: ActionArgumentType;
                  value: string;
                  array: boolean;
                },
              );
            }
          }
        });
      }

      const runId = nid();

      // const queue = await createQueue<{
      //   runId: string;
      // }>("actionJanitor", async (payload, job) => {
      //   const run = await prisma.actionRun.findFirst({
      //     where: {
      //       id: payload.runId,
      //       claimantServerId: null,
      //       status: ActionRunStatus.PENDING,
      //       runBehaviour: {
      //         in: [
      //           "RANDOM_SERVER",
      //           "SELECTED_SERVER",
      //           "SELECTED_PLACE_VERSION",
      //         ],
      //       },
      //     },
      //     include: {
      //       details: true,
      //     },
      //   });

      //   if (!run) {
      //     return;
      //   }

      //   await prisma.actionRun.update({
      //     where: {
      //       id: run.id,
      //     },
      //     data: {
      //       status: ActionRunStatus.FAILED,
      //       details: {
      //         create: {
      //           type: ActionRunDetailType.FAILED,
      //           content: {
      //             message: "Run timed out. No server claimed the run.",
      //           },
      //         },
      //       },
      //     },
      //   });
      // });

      await queues.enqueue("actionJanitor", {
        payload: {
          runId,
        },
        runAt: addMinutes(new Date(), 2),
        id: runId,
      });

      await openCloud.safePublishMessage<
        Omit<typeof body & { runId: string; placeVersion: number }, "version">
      >({
        topic: "metrik",
        virtualTopic: "action:run",
        message: {
          key: action.key,
          arguments: Array.from(args),
          placeVersion: body.version,
          placeId: body.placeId,
          serverIds: body.serverIds,
          runId,
          exclusive: body.exclusive,
        },
        universeId: project.universeId,
      });

      const run = await prisma.actionRun.create({
        data: {
          id: runId,
          status: ActionRunStatus.PENDING,
          projectId: project.id,
          placeId: String(body.placeId),
          placeVersion: body.version,
          exclusive: body.exclusive,
          key: body.key,

          name: action.name,
          arguments: body.arguments?.length
            ? {
                createMany: {
                  data: body.arguments?.map((arg) => ({
                    id: nid(),
                    type: arg.type,
                    name: arg.name,
                    value: arg.value,
                    array: arg.array,
                  })) as Omit<ActionRunArguments[], "runId">,
                },
              }
            : undefined,
          // placeVersions: {
          //   createMany: {
          //     data: isPlaceVersionBehaviour(body.behaviour)
          //       ? body.placeVersions?.map((placeVersion) => ({
          //           id: nid(),
          //           placeVersion: String(placeVersion),
          //         })) ?? []
          //       : [],
          //   },
          // },
          serverIds: body.serverIds ?? [],
        },
      });

      return {
        message: "Action run started",
        runId: run.id,
      };
    },
    {
      detail: {
        tags: ["Actions"],
        summary: "Run Action",
        security: [
          {
            Token: [],
          },
        ],
      },
      type: "application/json",

      body: t.Object({
        key: t.String(),
        version: t.Number({
          description:
            "The place version (functionally the action version) of the action to run. Use 0 to run the latest version.",
          default: 0,
        }),
        placeId: t.Number(),
        serverIds: t.Optional(t.Array(t.Lowercase(t.String()))),
        exclusive: t.Boolean(),
        arguments: t.Optional(
          t.Array(
            t.Object({
              type: NativeEnum(ActionArgumentType),
              name: t.String(),
              value: t.String(),
              array: t.Boolean({
                default: false,
              }),
            }),
            {
              maxItems: 5,
            },
          ),
        ),
      }),
    },
  )
  .post(
    "/claim",
    async ({ prisma, project, body, set, ...ctx }) => {
      robloxRestricted(ctx.request.headers, ctx.userId, ctx.request.url);
      const server = await prisma.activeServer.findFirst({
        where: {
          serverId: body.serverId,
          projectId: project.id,
        },
      });

      if (!server) {
        throw new MError({
          message: "Server not found",
          code: "NOT_FOUND",
        });
      }

      const run = await prisma.actionRun.findFirst({
        where: {
          id: body.runId,
          projectId: project.id,
          status: ActionRunStatus.PENDING,
          exclusive: true,
        },
      });

      if (!run) {
        throw new MError({
          message: "Run not found",
          code: "NOT_FOUND",
        });
      }

      if (run.claimantServerId) {
        set.status = 409;
        return {
          success: false,
          message: "Run already claimed",
        };
      }

      await prisma.actionRun.update({
        where: {
          id: run.id,
        },
        data: {
          claimantServerId: body.serverId,
          details: {
            create: {
              id: nid(),
              type: ActionRunDetailType.CLAIMED,
              content: {
                serverId: body.serverId,
              },
            },
          },
        },
      });

      return { success: true, message: "Run claimed" };
    },
    {
      detail: {
        tags: ["Actions"],
        summary: "Claim Action run",
        security: [
          {
            Token: [],
          },
        ],
      },
      type: "application/json",
      body: t.Object({
        runId: t.String(),
        serverId: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  .post(
    "/return",
    async ({ prisma, project, body }) => {
      if (body.status === ActionRunStatus.PENDING) {
        return { message: "Result ignored" };
      }

      const run = await prisma.actionRun.findFirst({
        where: {
          id: body.runId,
          projectId: project.id,
          status: ActionRunStatus.PENDING,
        },
      });

      if (!run) {
        throw new MError({
          message: "Run not found",
          code: "NOT_FOUND",
        });
      }

      let result: Prisma.JsonValue | undefined;

      switch (typeof body.result) {
        case "string":
          if (body.result.length > 500) {
            `Result truncated and stringified. Try to return a shorter result next time: ${body.result.substring(
              0,
              500,
            )}`;
          }

          result = body.result;
          break;
        case "number":
          if (String(body.result).length > 500) {
            `Result truncated and stringified. Try to return a shorter result next time: ${String(
              body.result,
            ).substring(0, 500)}`;
          }

          result = body.result;
          break;
        case "boolean":
          result = body.result;
          break;
        case "object":
          if (JSON.stringify(body.result).length > 500) {
            `Result truncated and stringified. Try to return a shorter result next time: ${JSON.stringify(
              body.result as Prisma.JsonValue,
            ).substring(0, 500)}`;
          }

          result = body.result as Prisma.JsonValue;
          break;
        case "undefined":
          result = undefined;
          break;
        default:
          if (body.result === null) {
            result = null;
            break;
          }

          throw new MError({
            message: "Invalid result type",
            code: "BAD_REQUEST",
          });
      }

      await prisma.actionRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: body.status,
          result: {
            create: {
              id: nid(),
              success: body.status === ActionRunStatus.SUCCESS ?? false,
              value: result ?? "Nothing returned",
            },
          },
        },
      });

      return { message: "Run updated" };
    },
    {
      detail: {
        tags: ["Actions"],
        summary: "Return a result of an Action run",
        security: [
          {
            Token: [],
          },
        ],
      },
      type: "application/json",
      body: t.Object({
        runId: t.String(),
        result: t.Any(),
        status: NativeEnum(ActionRunStatus),
      }),
    },
  )
  .get(
    "/list",
    async ({ prisma, project }) => {
      const actions = await prisma.action.findMany({
        where: {
          projectId: project.id,
        },
        include: {
          arguments: true,
        },
      });

      // merge actions with same name but different place versions
      const actionsWithSameName = actions
        .reduce<
          Omit<
            (typeof actions)[0] & { placeVersions: number[] },
            "placeVersion"
          >[]
        >((acc, action) => {
          const existingAction = acc.find((a) => a.name === action.name);

          if (existingAction) {
            existingAction.placeVersions.push(action.placeVersion);
          } else {
            acc.push({
              ...action,
              placeVersions: [action.placeVersion],
            });
          }

          return acc;
        }, [])
        .map((action) => ({
          id: action.id,
          name: action.name,
          placeVersions: action.placeVersions,
          description: action.description ?? undefined,
          serverIds: (action.serverIds as string[]) ?? [],
          arguments: action.arguments.map((arg) => ({
            id: arg.id,
            type: arg.type,
            name: arg.name,
            description: arg.description ?? undefined,
            required: arg.required,
            default: arg.default,
          })),
        }));

      return actionsWithSameName;
    },
    {
      detail: {
        tags: ["Actions"],
        summary: "List registered actions",
        security: [
          {
            Token: [],
          },
        ],
      },
      response: t.Array(
        t.Object({
          id: t.String(),
          name: t.String(),
          placeVersions: t.Array(t.Number()),
          description: t.Optional(t.String()),
          serverIds: t.Array(t.String()),
          arguments: t.Array(
            t.Object({
              id: t.String(),
              type: NativeEnum(ActionArgumentType),
              name: t.String(),
              required: t.Boolean(),
              default: t.Nullable(t.String()),
              description: t.Optional(t.String()),
            }),
          ),
        }),
      ),
    },
  );
//   register: robloxOnlyProtectedProcedure
//     .meta({
//       openapi: {
//         method: "POST",
//         summary: "Register an action",
//         path: "/actions/register",
//         tags: ["Actions"],
//         protect: true,
//         example: {
//           request: {
//             serverId: "a1896688-e403-4a04-b2c1-08f2829952e1",
//             key: "",
//             name: "",
//             description: "",
//             placeVersion: 123,
//             arguments: [
//               {
//                 type: "STRING, NUMBER, BOOLEAN or PLAYER",
//                 name: "",
//                 description: "",
//                 required: true,
//                 default: "",
//               },
//             ],
//           },
//           response: {
//             message: "Action registered",
//           },
//         },
//       },
//     })
//     .input(
//       z.object({
//         serverId: z.string().toLowerCase().uuid(),
//         key: z.string(),
//         name: z.string(),
//         placeVersion: z.number(),
//         description: z.string().max(500).optional(),
//         arguments: z
//           .array(
//             z.object({
//               type: z.nativeEnum(ActionArgumentType),
//               name: z.string(),
//               description: z.string().max(200).optional(),
//               required: z.boolean(),
//               default: z.string().optional(),
//             }),
//           )
//           .max(5)
//           .optional(),
//       }),
//     )
//     .output(
//       z.object({
//         message: z.string(),
//       }),
//     )
//     .mutation(async ({ ctx, input }) => {
//       if (input.key.startsWith("internal:")) {
//         return { message: "Action registered" };
//       }

//       const server = await ctx.prisma.activeServer.findFirst({
//         where: {
//           serverId: input.serverId,
//           projectId: ctx.project.id,
//         },
//       });

//       if (!server) {
//         throw new MError({
//           message: "Server not found",
//           code: "NOT_FOUND",
//         });
//       }

//       const existingAction = await ctx.prisma.action.findFirst({
//         where: {
//           key: input.key,
//           projectId: ctx.project.id,
//         },
//         include: {
//           placeVersions: true,
//           serverIds: true,
//           arguments: true,
//         },
//       });

//       let action: Action | undefined;

//       if (existingAction) {
//         if (
//           existingAction.serverIds.some(
//             (serverId) => serverId.serverId === server.serverId,
//           )
//         ) {
//           throw new MError({
//             message: "Action already registered",
//             code: "BAD_REQUEST",
//           });
//         }

//         action = await ctx.prisma.action.update({
//           where: {
//             id: existingAction.id,
//           },
//           data: {
//             name: input.name,
//             arguments:
//               input.arguments && existingAction?.arguments
//                 ? {
//                     createMany: {
//                       data: input.arguments,
//                     },
//                     deleteMany: {
//                       id: {
//                         in: existingAction?.arguments.map((arg) => arg.id),
//                       },
//                     },
//                   }
//                 : input.arguments
//                   ? {
//                       createMany: {
//                         data: input.arguments,
//                       },
//                     }
//                   : existingAction?.arguments
//                     ? {
//                         deleteMany: {
//                           id: {
//                             in: existingAction?.arguments.map((arg) => arg.id),
//                           },
//                         },
//                       }
//                     : undefined,

//             placeVersions: {
//               create: existingAction?.placeVersions.find(
//                 (pv) => pv.placeVersion === String(input.placeVersion),
//               )
//                 ? undefined
//                 : {
//                     placeVersion: String(input.placeVersion),
//                   },
//             },
//             serverIds: {
//               create: {
//                 serverId: server.id,
//               },
//             },
//           },
//         });
//       } else {
//         action = await ctx.prisma.action.create({
//           data: {
//             key: input.key,
//             name: input.name,
//             description: input.description,
//             placeVersions: {
//               create: {
//                 placeVersion: String(input.placeVersion),
//               },
//             },
//             arguments: input.arguments
//               ? {
//                   createMany: {
//                     data: input.arguments,
//                   },
//                 }
//               : undefined,
//             serverIds: {
//               create: {
//                 serverId: server.id,
//               },
//             },
//             projectId: ctx.project.id,
//           },
//         });
//       }

//       const existingActionsCount = await ctx.prisma.action.count({
//         where: {
//           projectId: ctx.project.id,
//         },
//       });

//       if (existingActionsCount >= 250 && action.id !== existingAction?.id) {
//         throw new MError({
//           message: "Hard action limit reached",
//           code: "BAD_REQUEST",
//         });
//       }

//       return { message: "Action registered" };
//     }),
//   run: protectedProcedure
//     .meta({
//       openapi: {
//         method: "POST",
//         summary: "Run an action",
//         path: "/actions/run",
//         tags: ["Actions"],
//         protect: true,
//         example: {
//           request: {
//             key: "",
//             placeVersions: [123, 124],
//             serverIds: [
//               "7eae8e1d-6d21-4b0d-8b61-121a8aa1c1bd",
//               "90a26b82-de63-408f-ab6c-2d02f8360069",
//             ],
//             arguments: [
//               {
//                 type: "STRING, NUMBER, BOOLEAN or PLAYER",
//                 name: "",
//                 value: "",
//               },
//             ],
//           },
//           response: {
//             message: "Action started",
//             runId: "",
//           },
//         },
//       },
//     })
//     .input(
//       z
//         .object({
//           key: z.string(),
//           placeVersions: z.array(z.number()).max(10).optional(),
//           serverIds: z
//             .array(z.string().toLowerCase().uuid())
//             .max(10)
//             .optional(),
//           singleServer: z.boolean().optional(),
//           arguments: z
//             .array(
//               z.object({
//                 type: z.nativeEnum(ActionArgumentType),
//                 name: z.string(),
//                 value: z.string(),
//               }),
//             )
//             .max(5)
//             .optional(),
//         })
//         .strict(),
//     )
//     .output(
//       z.object({
//         message: z.string(),
//         runId: z.string().optional(),
//       }),
//     )
//     .mutation(async ({ ctx, input }) => {
//       if (ctx.project.studio.plan === "FREE") {
//         const [usageLimits, runCount] = await ctx.prisma.$transaction([
//           ctx.prisma.usageLimits.findFirst({
//             where: {
//               studioId: ctx.project.studio.id,
//             },
//           }),
//           ctx.prisma.run.count({
//             where: {
//               projectId: ctx.project.id,
//               timestamp: {
//                 gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 1 month
//               },
//             },
//           }),
//         ]);

//         if (!usageLimits) {
//           throw new MError({
//             message: "Usage limit not found",
//             code: "INTERNAL_SERVER_ERROR",
//           });
//         }

//         if (runCount >= usageLimits.actionRunsCount) {
//           throw new MError({
//             message: "Usage limit reached",
//             code: "BAD_REQUEST",
//           });
//         }
//       }

//       const action = await prisma.action.findFirst({
//         where: {
//           key: input.key,
//           projectId: ctx.project.id,
//           placeVersions: input.placeVersions?.length
//             ? {
//                 some: {
//                   placeVersion: {
//                     in: input.placeVersions.map((placeVersion) =>
//                       String(placeVersion),
//                     ),
//                   },
//                 },
//               }
//             : undefined,
//           serverIds: input.serverIds?.length
//             ? {
//                 some: {
//                   serverId: {
//                     in: input.serverIds,
//                   },
//                 },
//               }
//             : undefined,
//         },
//         include: {
//           arguments: true,
//         },
//       });

//       if (!action) {
//         throw new MError({
//           message: "Action not found",
//           code: "NOT_FOUND",
//         });
//       }

//       const args = new Set<{
//         name: string;
//         type: ActionArgumentType;
//         value: string;
//       }>();

//       const regexes = {
//         [ActionArgumentType.STRING]: /^.{0,512}$/,
//         [ActionArgumentType.NUMBER]: /^\d+$/,
//         [ActionArgumentType.BOOLEAN]: /^(true|false)$/i,
//         [ActionArgumentType.PLAYER]: /^\d+$/,
//       };

//       if (action.arguments.length) {
//         const inputArgs = input.arguments?.map((arg) => arg.name) ?? [];

//         action.arguments.forEach((arg) => {
//           if (!arg.required && !arg.default && !inputArgs.includes(arg.name)) {
//             return;
//           }

//           if (
//             inputArgs.includes(arg.name) &&
//             !arg.required &&
//             !regexes[arg.type].test(
//               input.arguments?.find((a) => a.name === arg.name)?.value ?? "",
//             )
//           ) {
//             throw new MError({
//               message: `Invalid arguments type, expected ${arg.type.toLowerCase()}`,
//               code: "BAD_REQUEST",
//             });
//           }

//           if (arg.required && !arg.default && !inputArgs.includes(arg.name)) {
//             throw new MError({
//               message: "Invalid arguments",
//               code: "BAD_REQUEST",
//             });
//           }

//           if (arg.default && !inputArgs.includes(arg.name)) {
//             args.add({
//               name: arg.name,
//               type: arg.type,
//               value: arg.default,
//             });
//           } else if (
//             inputArgs.includes(arg.name) &&
//             input.arguments?.find((inputArg) => inputArg.name === arg.name)
//           ) {
//             args.add(
//               input.arguments?.find(
//                 (inputArg) => inputArg.name === arg.name,
//               ) as {
//                 name: string;
//                 type: ActionArgumentType;
//                 value: string;
//               },
//             );
//           }
//         });
//       }

//       const runId = cuid();

//       const payload = {
//         key: action.key,
//         arguments: Array.from(args),
//         placeVersions: input.placeVersions,
//         serverIds: input.serverIds,
//         runId,
//       };

//       await ctx.openCloud.safePublishMessage<typeof input>({
//         topic: "metrik",
//         virtualTopic: "action:run",
//         message: payload,
//         universeId: ctx.project.universeId,
//       });

//       const run = await ctx.prisma.run.create({
//         data: {
//           id: runId,
//           status: RunStatus.PENDING,
//           projectId: ctx.project.id,
//           key: input.key,
//           name: action.name,
//           arguments: input.arguments?.length
//             ? {
//                 createMany: {
//                   data: input.arguments?.map((arg) => ({
//                     type: arg.type,
//                     name: arg.name,
//                     value: arg.value,
//                   })) as Omit<RunArguments[], "id" | "runId">,
//                 },
//               }
//             : undefined,
//           placeVersions: {
//             createMany: {
//               data:
//                 input.placeVersions?.map((placeVersion) => ({
//                   placeVersion: String(placeVersion),
//                 })) ?? [],
//             },
//           },
//           serverIds: {
//             createMany: {
//               data:
//                 input.serverIds?.map((serverId) => ({
//                   serverId,
//                 })) ?? [],
//             },
//           },
//         },
//       });

//       return {
//         message: "Action started",
//         runId: run.id,
//       };
//     }),
//   return: protectedProcedure
//     .meta({
//       openapi: {
//         method: "POST",
//         summary: "Return the result of an action",
//         path: "/actions/return",
//         tags: ["Actions"],
//         protect: true,
//         example: {
//           request: {
//             runId: "",
//             result: "string, number, boolean, array, object or null",
//             status: "SUCCESS, ERROR or SKIPPED",
//           },
//           response: {
//             message: "Run updated",
//           },
//         },
//       },
//     })
//     .input(
//       z
//         .object({
//           runId: z.string(),
//           result: z.any(),
//           status: z.nativeEnum(RunStatus),
//         })
//         .strict(),
//     )
//     .output(
//       z.object({
//         message: z.string(),
//       }),
//     )
//     .mutation(async ({ ctx, input }) => {
//       if (
//         input.status === RunStatus.SKIPPED ||
//         input.status === RunStatus.PENDING
//       ) {
//         return { message: "Result ignored" };
//       }

//       const run = await ctx.prisma.run.findFirst({
//         where: {
//           id: input.runId,
//           projectId: ctx.project.id,
//           status: RunStatus.PENDING,
//         },
//       });

//       if (!run) {
//         throw new MError({
//           message: "Run not found",
//           code: "NOT_FOUND",
//         });
//       }

//       let result: Prisma.JsonValue | undefined;

//       switch (typeof input.result) {
//         case "string":
//           if (input.result.length > 500) {
//             `Result truncated and stringified. Try to return a shorter result next time: ${input.result.substring(
//               0,
//               500,
//             )}`;
//           }

//           result = input.result;
//           break;
//         case "number":
//           if (String(input.result).length > 500) {
//             `Result truncated and stringified. Try to return a shorter result next time: ${String(
//               input.result,
//             ).substring(0, 500)}`;
//           }

//           result = input.result;
//           break;
//         case "boolean":
//           result = input.result;
//           break;
//         case "object":
//           if (JSON.stringify(input.result).length > 500) {
//             `Result truncated and stringified. Try to return a shorter result next time: ${JSON.stringify(
//               input.result as Prisma.JsonValue,
//             ).substring(0, 500)}`;
//           }

//           result = input.result as Prisma.JsonValue;
//           break;
//         case "undefined":
//           result = undefined;
//           break;
//         default:
//           if (input.result === null) {
//             result = null;
//             break;
//           }

//           throw new MError({
//             message: "Invalid result type",
//             code: "BAD_REQUEST",
//           });
//       }

//       await ctx.prisma.run.update({
//         where: {
//           id: run.id,
//         },
//         data: {
//           status: input.status,
//           result: {
//             create: {
//               success: input.status === RunStatus.SUCCESS ?? false,
//               value: result ?? "Nothing returned",
//             },
//           },
//         },
//       });

//       return { message: "Run updated" };
//     }),
//   list: protectedProcedure
//     .meta({
//       openapi: {
//         method: "GET",
//         summary: "List registered actions",
//         path: "/actions/list",
//         tags: ["Actions"],
//         protect: true,
//         example: {
//           response: [
//             {
//               key: "",
//               name: "",
//               description: "",
//               placeVersions: [123, 124],
//               serverIds: [
//                 "7eae8e1d-6d21-4b0d-8b61-121a8aa1c1bd",
//                 "90a26b82-de63-408f-ab6c-2d02f8360069",
//               ],
//               arguments: [
//                 {
//                   type: "STRING, NUMBER, BOOLEAN or PLAYER",
//                   name: "",
//                   required: true,
//                   default: "",
//                   description: "",
//                 },
//               ],
//             },
//           ],
//         },
//       },
//     })
//     .input(z.object({}))
//     .output(
//       z.array(
//         z.object({
//           key: z.string(),
//           name: z.string(),
//           placeVersions: z.array(z.number()),
//           serverIds: z.array(z.string().uuid()),
//           description: z.string().optional(),
//           arguments: z
//             .array(
//               z.object({
//                 id: z.string(),
//                 type: z.nativeEnum(ActionArgumentType),
//                 name: z.string(),
//                 required: z.boolean(),
//                 default: z.string().nullish(),
//                 description: z.string().optional(),
//               }),
//             )
//             .max(5),
//         }),
//       ),
//     )
//     .query(async ({ ctx }) => {
//       const actions = await ctx.prisma.action.findMany({
//         where: {
//           projectId: ctx.project.id,
//         },
//         include: {
//           arguments: true,
//           placeVersions: true,
//           serverIds: true,
//         },
//       });

//       return actions.map((action) => ({
//         key: action.key,
//         name: action.name,
//         placeVersions: action.placeVersions.map((pv) =>
//           Number(pv.placeVersion),
//         ),
//         description: action.description ?? undefined,
//         serverIds: action.serverIds.map((serverId) => serverId.serverId),
//         arguments: action.arguments.map((arg) => ({
//           id: arg.id,
//           type: arg.type,
//           name: arg.name,
//           description: arg.description ?? undefined,
//           required: arg.required,
//           default: arg.default,
//         })),
//       }));
//     }),
// });
