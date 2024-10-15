import { Elysia, t } from "elysia";
import { Prettify } from "elysia/types";
import { z } from "zod";

import { prisma, type ExtendedPrismaClient } from "@metrik/db";
import { type ModerationEvent, type Project } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { context } from "../context";
import { MError } from "../utils/error";
import { NativeEnum } from "../utils/native-enum";

async function checkUsage(
  plan: string,
  project: Project,
  prisma: ExtendedPrismaClient,
) {
  const [count, usageLimits] = await prisma.$transaction([
    prisma.moderationEvent.count({
      where: {
        projectId: project.id,
        timestamp: {
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
        },
      },
    }),
    prisma.usageLimits.findFirst({
      where: {
        studioId: project.studioId,
      },
    }),
  ]);

  if (!usageLimits) {
    throw new MError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Usage limits not found",
    });
  }

  if (count >= usageLimits.moderationEventsCount) {
    throw new MError({
      code: "BAD_REQUEST",
      message: "Usage limit reached",
    });
  }

  return;
}

export const moderationRouter = new Elysia({
  prefix: "/moderation",
})
  .use(context)
  .post(
    "/ban",
    async ({ project, body, prisma, openCloud }) => {
      await checkUsage(project.studio.plan, project, prisma);
      const { status } = await getStatus(body.userId, project);

      if (status === "BANNED") {
        throw new MError({
          code: "BAD_REQUEST",
          message: "User is already banned",
        });
      }

      const user = await openCloud.getUser(body.userId);

      if (!user) {
        throw new MError({
          code: "BAD_REQUEST",
          message: "Invalid user",
        });
      }

      await prisma.moderationEvent.create({
        data: {
          id: nid(),
          userId: String(body.userId),
          expiry: body.expiry,
          moderatorUserId: String(body.moderatorId),
          reason: body.reason,
          type: "BAN",
          projectId: project.id,
        },
      });

      await openCloud.safePublishMessage({
        universeId: project.universeId,
        topic: "metrik",
        virtualTopic: "moderation",
        message: {
          type: "BAN",
          userId: body.userId,
          reason: body.reason,
          expiry: body.expiry?.toISOString() ?? null,
        },
      });

      if (!body.expiry) {
        return {
          message: "Banned user",
        };
      } else {
        return {
          message: "Banned user until " + body.expiry.toLocaleString(),
        };
      }
    },
    {
      type: "application/json",
      body: t.Object({
        userId: t.Number({
          description: "Offending user Roblox ID",
        }),
        expiry: t.Nullable(t.Date()),
        moderatorId: t.Number({
          description: "Moderator Roblox ID",
        }),
        reason: t.String({
          maxLength: 1000,
        }),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Moderation"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Ban user",
      },
    },
  )
  .post(
    "/unban",
    async ({ project, body, prisma, openCloud }) => {
      const { status } = await getStatus(body.userId, project);

      if (status === "CLEAR") {
        throw new MError({
          code: "BAD_REQUEST",
          message: "User is not banned",
        });
      }

      const user = await openCloud.getUser(body.userId);

      if (!user) {
        throw new MError({
          code: "BAD_REQUEST",
          message: "Invalid user",
        });
      }

      await prisma.moderationEvent.create({
        data: {
          id: nid(),
          userId: String(body.userId),
          moderatorUserId: String(body.moderatorId),
          reason: body.reason,
          type: "UNBAN",
          projectId: project.id,
        },
      });

      return {
        message: "Unbanned user",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        userId: t.Number({
          description: "Offending user Roblox ID",
        }),
        moderatorId: t.Number({
          description: "Moderator Roblox ID",
        }),
        reason: t.String({
          maxLength: 1000,
        }),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Moderation"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Unban user",
      },
    },
  )
  .post(
    "/kick",
    async ({ project, body, prisma, openCloud }) => {
      await checkUsage(project.studio.plan, project, prisma);
      const user = await openCloud.getUser(body.userId);

      if (!user) {
        throw new MError({
          code: "BAD_REQUEST",
          message: "Invalid user",
        });
      }

      await prisma.moderationEvent.create({
        data: {
          id: nid(),
          userId: String(body.userId),
          moderatorUserId: String(body.moderatorId),
          reason: body.reason,
          type: "KICK",
          projectId: project.id,
        },
      });

      await openCloud.safePublishMessage({
        universeId: project.universeId,
        topic: "metrik",
        virtualTopic: "moderation",
        message: {
          type: "KICK",
          userId: body.userId,
          reason: body.reason,
        },
      });

      return {
        message: "Kicked user",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        userId: t.Number({
          description: "Offending user Roblox ID",
        }),
        moderatorId: t.Number({
          description: "Moderator Roblox ID",
        }),
        reason: t.String({
          maxLength: 1000,
        }),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Moderation"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Kick user",
      },
    },
  )
  .post(
    "/warn",
    async ({ project, body, prisma, openCloud }) => {
      await checkUsage(project.studio.plan, project, prisma);
      const user = await openCloud.getUser(body.userId);

      if (!user) {
        throw new MError({
          code: "BAD_REQUEST",
          message: "Invalid user",
        });
      }

      await prisma.moderationEvent.create({
        data: {
          id: nid(),
          userId: String(body.userId),
          moderatorUserId: String(body.moderatorId),
          reason: body.reason,
          type: "WARN",
          projectId: project.id,
        },
      });

      await openCloud.safePublishMessage({
        universeId: project.universeId,
        topic: "metrik",
        virtualTopic: "moderation",
        message: {
          type: "WARN",
          userId: body.userId,
          reason: body.reason,
        },
      });

      return {
        message: "Warned user",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        userId: t.Number({
          description: "Offending user Roblox ID",
        }),
        moderatorId: t.Number({
          description: "Moderator Roblox ID",
        }),
        reason: t.String({
          maxLength: 1000,
        }),
      }),
      response: t.Object({
        message: t.String(),
      }),
      detail: {
        tags: ["Moderation"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Warn user",
      },
    },
  )
  .get(
    "/status",
    async ({ query, project }) => {
      const { status, ban } = await getStatus(Number(query.userId), project);

      if (status === "BANNED") {
        return {
          status,
          reason: ban?.reason ?? undefined,
          expiry: ban?.expiry ?? undefined,
        };
      }

      return {
        status: "CLEAR",
      };
    },
    {
      query: t.Object({
        userId: t.Numeric(),
      }),

      response: t.Object({
        status: NativeEnum({
          BANNED: "BANNED",
          CLEAR: "CLEAR",
        }),
        reason: t.Optional(t.String()),
        expiry: t.Optional(t.Date()),
      }),
      detail: {
        tags: ["Moderation"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "Get moderation status",
      },
    },
  )
  .get(
    "/bans",
    async ({ project }) => {
      const allEvents = await prisma.moderationEvent.findMany({
        where: {
          projectId: project.id,
          type: {
            in: ["BAN", "UNBAN"],
          },
        },
      });

      const LATEST_BAN = new Map<string, ModerationEvent>();
      const LATEST_UNBAN = new Map<string, ModerationEvent>();

      for (const event of allEvents) {
        const latestBan = LATEST_BAN.get(event.userId);
        const latestUnban = LATEST_UNBAN.get(event.userId);

        if (event.type === "BAN") {
          if (latestBan) {
            if (event.timestamp.getTime() > latestBan.timestamp.getTime()) {
              LATEST_BAN.set(event.userId, event);
            }
          } else {
            LATEST_BAN.set(event.userId, event);
          }
        } else if (event.type === "UNBAN") {
          if (latestUnban) {
            if (event.timestamp.getTime() > latestUnban.timestamp.getTime()) {
              LATEST_UNBAN.set(event.userId, event);
            }
          } else {
            LATEST_UNBAN.set(event.userId, event);
          }
        }
      }

      LATEST_BAN.forEach((event, userId) => {
        if (event.type === "BAN") {
          if (event.expiry && event.expiry < new Date()) {
            LATEST_BAN.delete(userId);
          }
        }

        if (LATEST_UNBAN.get(userId)) {
          if (
            event.timestamp.getTime() <
            LATEST_UNBAN.get(userId)!.timestamp.getTime()
          ) {
            LATEST_UNBAN.delete(userId);
          }
        }
      });

      const bans = Array.from(LATEST_BAN.values());

      return bans
        .sort((a, b) => {
          return a.timestamp.getTime() - b.timestamp.getTime();
        })
        .map(({ type, projectId, id, userId, ...event }) => ({
          ...event,
          userId: `${userId}`,
        }));
    },
    {
      detail: {
        tags: ["Moderation"],
        security: [
          {
            Token: [],
          },
        ],
        summary: "List all bans",
      },
      response: t.Array(
        t.Object({
          userId: t.String(),
          moderatorUserId: t.String(),
          reason: t.Nullable(t.String()),
          expiry: t.Nullable(t.Date()),
        }),
      ),
    },
  );

async function getStatus(userId: number, project: Project) {
  const [lastBan, lastUnban] = await prisma.$transaction([
    prisma.moderationEvent.findFirst({
      where: {
        userId: String(userId),
        projectId: project.id,
        type: "BAN",
      },
    }),
    prisma.moderationEvent.findFirst({
      where: {
        userId: String(userId),
        projectId: project.id,
        type: "UNBAN",
      },
    }),
  ]);

  if (lastBan && lastUnban) {
    if (lastBan.timestamp > lastUnban.timestamp) {
      if (lastBan.expiry && lastBan.expiry < new Date()) {
        return {
          status: "CLEAR",
        };
      }

      return {
        status: "BANNED",
        ban: lastBan,
      };
    } else {
      return {
        status: "CLEAR",
      };
    }
  } else if (lastBan) {
    if (lastBan.expiry && lastBan.expiry < new Date()) {
      return {
        status: "CLEAR",
      };
    }

    return {
      status: "BANNED",
      ban: lastBan,
    };
  }

  return {
    status: "CLEAR",
  };
}
