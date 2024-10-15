import { id } from "date-fns/locale";
import { Elysia, t, type Context } from "elysia";
import { z } from "zod";

import { prisma } from "@metrik/db";
import { ServerType } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { context } from "../context";
import { robloxOnly, robloxRestricted } from "../procedures";
import { backgroundJobs } from "../queues";
import { autoFilters } from "../utils/auto-filters";
import { MError } from "../utils/error";
import { actionJanitor, logJanitor } from "../utils/janitors";
import { NativeEnum } from "../utils/native-enum";

export const serversRouter = new Elysia({
  prefix: "/server",
})
  .use(context)
  .post(
    "/start",
    async ({ project, prisma, body, ...ctx }) => {
      robloxRestricted(ctx.request.headers, ctx.userId, ctx.request.url);
      const [
        existingServer,
        existingServersCount,
        presetFilters,
        customFilters,
      ] = await prisma.$transaction([
        prisma.activeServer.findFirst({
          where: {
            serverId: body.serverId,
            projectId: project.id,
          },
        }),
        prisma.activeServer.count({
          where: {
            projectId: project.id,
          },
        }),
        prisma.presetAutoFilter.findMany({
          where: {
            projectId: project.id,
          },
          select: {
            presetAutoFilter: true,
          },
        }),
        prisma.customAutoFilter.findMany({
          where: {
            projectId: project.id,
          },
          select: {
            regex: true,
            field: true,
            name: true,
          },
        }),
      ]);

      if (existingServer) {
        throw new MError({
          message: "Server already exists",
          code: "BAD_REQUEST",
        });
      }

      if (existingServersCount >= 15000) {
        throw new MError({
          message: "Hard limit of 15,000 servers reached",
          code: "BAD_REQUEST",
        });
      }

      await prisma.activeServer.create({
        data: {
          id: nid(),
          serverId: body.serverId,
          projectId: project.id,
          serverType: body.type,
          placeVersion: body.placeVersion,
          maxPlayers: body.maxPlayers,
          placeId: String(body.placeId),
          region: body.region,
          players: [],
        },
      });

      return {
        message: "Server started",
        issues: {
          presetFilters: presetFilters
            .map((presetFilter) => {
              const autoFilter = autoFilters.find(
                (autoFilter) =>
                  autoFilter.name === presetFilter.presetAutoFilter,
              );

              if (!autoFilter) {
                return undefined;
              }

              return {
                name: autoFilter.name,
                regex: autoFilter.pattern,
                field: autoFilter.field,
              };
            })
            .filter((m) => m !== undefined),
          customFilters: customFilters,
        },
      };
    },
    {
      type: "application/json",

      body: t.Object({
        serverId: t.String(),
        placeVersion: t.Number(),
        placeId: t.Number(),
        maxPlayers: t.Number(),
        region: t.Optional(
          t.String({
            maxLength: 2,
          }),
        ),
        type: NativeEnum(ServerType),
      }),
      response: t.Object({
        message: t.String(),
        issues: t.Object({
          presetFilters: t.Array(
            t.Object({
              name: t.String(),
              regex: t.String(),
              field: t.String(),
            }),
          ),
          customFilters: t.Array(
            t.Object({
              name: t.String(),
              regex: t.String(),
              field: t.String(),
            }),
          ),
        }),
      }),
      detail: {
        tags: ["Servers"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Start new active server",
      },
    },
  )
  .post(
    "/stop",
    async ({ project, prisma, body, openCloud, backgroundJobs, ...ctx }) => {
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

      await backgroundJobs.backgroundJob(async () => {
        await Promise.all([
          // actionJanitor(server.id),
          // logJanitor(server.serverId),
          prisma.activeServer.delete({
            where: {
              id: server.id,
            },
          }),
        ]);
      });

      await openCloud.safePublishMessage({
        universeId: project.universeId,
        message: {
          action: "SHUTDOWN",
          serverId: server.serverId,
        },
        topic: "metrik",
        virtualTopic: "servers",
      });

      return { message: "Server stopped" };
    },
    {
      type: "application/json",
      body: t.Object({
        serverId: t.String(),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Servers"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Stop active server",
      },
    },
  )
  .post(
    "/heartbeat",
    async ({ project, prisma, body }) => {
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

      if (!body.players) {
        throw new MError({
          message: "Players not found",
          code: "NOT_FOUND",
        });
      }

      await prisma.activeServer.update({
        where: {
          id: server.id,
        },
        data: {
          lastPing: new Date(),
          players: body.players,
        },
      });

      return { message: "Server heartbeat updated" };
    },
    {
      type: "application/json",

      body: t.Object({
        serverId: t.String(),
        players: t.Optional(t.Array(t.Number())),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Servers"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Update server heartbeat",
      },
    },
  )
  .get(
    "/latest",
    async ({ prisma, project }) => {
      const servers = await prisma.activeServer.findMany({
        where: {
          projectId: project.id,
        },
      });

      const latestPlaceVersion = servers.reduce(
        (acc, server) => {
          if (server.placeVersion > acc.placeVersion) {
            return server;
          }

          return acc;
        },
        { placeVersion: 0 },
      );

      return { latest: latestPlaceVersion.placeVersion };
    },
    {
      detail: {
        tags: ["Servers"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Get latest place version",
      },
      response: t.Object({
        latest: t.Number(),
      }),
      type: "application/json",
    },
  );
