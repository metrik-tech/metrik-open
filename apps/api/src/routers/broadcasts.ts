import { Elysia, t } from "elysia";
import { z } from "zod";

import { BroadcastType } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { context } from "../context";
import { MError } from "../utils/error";
import { NativeEnum } from "../utils/native-enum";

export const broadcastsRouter = new Elysia({
  prefix: "/broadcasts",
})
  .use(context)
  .post(
    "/send",
    async ({ prisma, project, body, openCloud, userId }) => {
      const [usageLimits, broadcastCount] = await prisma.$transaction([
        prisma.usageLimits.findFirst({
          where: {
            studioId: project.studio.id,
          },
        }),
        prisma.broadcast.count({
          where: {
            projectId: project.id,
          },
        }),
      ]);

      if (!usageLimits) {
        throw new MError({
          message: "Usage limit not found",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      if (broadcastCount >= usageLimits.broadcastMessagesCount) {
        throw new MError({
          message: "Usage limit reached",
          code: "BAD_REQUEST",
        });
      }

      const broadcast = await prisma.broadcast.create({
        data: {
          id: nid(),
          message: body.message,
          type: body.type,
          userId,
          projectId: project.id,
          serverIds: !body.serverIds
            ? undefined
            : {
                createMany: {
                  data: body.serverIds.map((serverId) => ({
                    id: nid(),
                    serverId,
                  })),
                },
              },
          placeVersions: !body.placeVersions
            ? undefined
            : {
                createMany: {
                  data: body.placeVersions.map((placeVersion) => ({
                    id: nid(),
                    placeVersion: String(placeVersion),
                  })),
                },
              },
        },
      });

      const res = await openCloud.safePublishMessage<{
        id: string;
        message: string;
        type: BroadcastType;
      }>({
        topic: "metrik",
        virtualTopic: "broadcasts",
        message: {
          id: broadcast.id,
          message: broadcast.message,
          type: broadcast.type,
        },
        universeId: project.universeId,
      });

      if (!res.ok) {
        await prisma.broadcast.delete({
          where: {
            id: broadcast.id,
          },
        });

        throw new MError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send broadcast",
        });
      }

      return {
        message: "Broadcast sent",
        id: broadcast.id,
      };
    },
    {
      type: "application/json",
      body: t.Object({
        message: t.String({
          maxLength: 1000,
        }),
        type: NativeEnum(BroadcastType),
        serverIds: t.Optional(t.Array(t.Lowercase(t.String()))),
        placeVersions: t.Optional(t.Array(t.Number())),
      }),
      response: t.Object({
        message: t.String(),
        id: t.String(),
      }),
      detail: {
        tags: ["Broadcasts"],
        summary: "Send a broadcast",
        security: [
          {
            Token: [],
          },
        ],
      },
    },
  );
