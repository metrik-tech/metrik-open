import { getHTTPStatusCodeFromError } from "@trpc/server/unstable-core-do-not-import";
import { Elysia } from "elysia";
import { getIP } from "elysia-ip";

import { prisma } from "@metrik/db";
import { type Project } from "@metrik/db/client";
import {
  decode,
  getSessionTokenFromCookies,
  readSessionJWT,
} from "@metrik/jwt";
import { OpenCloud, type OpenCloudSession } from "@metrik/opencloud";

import { MError } from "./utils/error";
import { consola } from "./utils/log";
import { checker } from "./utils/roblox-ranges";
import { createQueues } from "./utils/queue";
import { queues as queueFactory, backgroundJobs as backgroundJobsFactory } from "./queues";

const PLACE_ID_TO_UNIVERSE_ID_MAP = new Map<string, string>();
const API_KEY_HASHED_TOKEN_VALIDITY_MAP = new Map<[string, string], boolean>();
export const IP_LOCK_OVERRIDE_USERS = new Set(["333179113", "1441032575"]);

const sessionRefresh = async (session: OpenCloudSession) => {
  await prisma.openCloudSession.update({
    where: {
      id: session.id,
    },
    data: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessTokenExpires: session.accessTokenExpires,
      refreshTokenExpires: session.refreshTokenExpires,
    },
  });
};


const queues = await queueFactory;
const backgroundJobs = await backgroundJobsFactory;

const messagingError = async (
  response: Response,
  project: {
    id: string;
    openCloudError: boolean;
  },
) => {
  if (
    (response.status === 401 ||
      response.status === 403 ||
      response.status === 400) &&
    !project.openCloudError
  ) {
    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        openCloudError: true,
      },
    });
  }
};

export const context = new Elysia({ name: "context" })
  .decorate("prisma", prisma)
  .decorate("queues", queues)
  .decorate("backgroundJobs", backgroundJobs)  
  .derive({ as: "global" }, async ({ prisma, request, params, queues }) => {
    const { projectId } = params as {
      projectId: string;
    };

    if (
      request.headers.get("Authorization") &&
      !request.headers.get("x-api-key")
    ) {
      const token =
        request.headers.get("Authorization")?.split("Bearer ")[1] ?? "";

      const sessionToken = await readSessionJWT({
        jwt: token,
        secret: process.env.NEXTAUTH_SECRET!,
      });

      if (!sessionToken) {
        throw new MError({
          message: "Invalid Token (Session not found)",
          code: "UNAUTHORIZED",
        });
      }

      const session = await prisma.session.findFirst({
        where: {
          sessionToken,
          expires: {
            gte: new Date(),
          },
        },
        select: {
          user: {
            select: {
              id: true,
              robloxId: true,
            },
          },
        },
      });

      if (!session) {
        throw new MError({
          message: "Invalid Token (Session not found)",
          code: "UNAUTHORIZED",
        });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          studio: {
            membership: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
        include: {
          studio: true,
          openCloudToken: true,
          openCloudSession: true,
        },
      });

      if (!project?.studio) {
        throw new MError({
          message: "Project not found",
          code: "NOT_FOUND",
        });
      }

      if (
        project.studio.plan === "NONE" ||
        (!project.studio.stripeSubscriptionId &&
          project.studio.trialEnds! < new Date())
      ) {
        throw new MError({
          message: "Studio is not subscribed to a plan",
          code: "UNAUTHORIZED",
        });
      }

      if (!project.openCloudSession) {
        throw new MError({
          message: "No Open Cloud Session",
          code: "UNAUTHORIZED",
        });
      }

      const openCloud = new OpenCloud({
        session: project.openCloudSession,
        project,
        sessionRefresh,
        messagingError,
        clientId: process.env.ROBLOX_CLIENT_ID!,
        clientSecret: process.env.ROBLOX_CLIENT_SECRET!,
      });

      return {
        project,
        studio: project.studio,
        openCloud,
        userId: session.user.robloxId!,
      };
    }

    if (
      request.headers.get("x-api-key") &&
      !request.headers.get("Authorization")
    ) {
      const token = await prisma.token.findFirst({
        where: {
          projectId,
          prefix: (request.headers.get("x-api-key") ?? "").slice(0, 11),
        },
        include: {
          project: {
            include: {
              studio: true,
              openCloudToken: true,
              openCloudSession: true,
            },
          },
        },
      });

      if (!token) {
        throw new MError({
          message: "Invalid Token",
          code: "UNAUTHORIZED",
        });
      }

      if (!token.userId) {
        throw new MError({
          message: "Token is outdated - please generate a new one",
          code: "UNAUTHORIZED",
        });
      }

      if (token.expiry && token.expiry < new Date()) {
        throw new MError({
          message: "Token Expired",
          code: "UNAUTHORIZED",
        });
      }

      if (
        API_KEY_HASHED_TOKEN_VALIDITY_MAP.has([token.hashedToken, projectId])
      ) {
        if (
          !API_KEY_HASHED_TOKEN_VALIDITY_MAP.get([token.hashedToken, projectId])
        ) {
          throw new MError({
            message: "Invalid Token",
            code: "UNAUTHORIZED",
          });
        }
      } else {
        const valid = await Bun.password.verify(
          request.headers.get("x-api-key") ?? "",
          token.hashedToken,
        );

        if (!valid) {
          throw new MError({
            message: "Invalid Token",
            code: "UNAUTHORIZED",
          });
        }
      }

      const project = token.project;
      const studio = project.studio;

      if (!project.openCloudSession) {
        throw new MError({
          message: "No Open Cloud Session",
          code: "UNAUTHORIZED",
        });
      }
      const openCloud = new OpenCloud({
        session: project.openCloudSession,
        project,
        sessionRefresh,
        messagingError,
        clientId: process.env.ROBLOX_CLIENT_ID!,
        clientSecret: process.env.ROBLOX_CLIENT_SECRET!,
      });

      const ip = request.url.startsWith("http://localhost:3001")
        ? "127.0.0.1"
        : getIP(request.headers);

      if (checker(ip ?? "") && !IP_LOCK_OVERRIDE_USERS.has(token.userId)) {
        const connectingPlaceId = request.headers.get("roblox-id");

        if (!connectingPlaceId) {
          throw new MError({
            message: "roblox-id header missing from Roblox IP subnet request",
            code: "UNAUTHORIZED",
          });
        }

        if (!PLACE_ID_TO_UNIVERSE_ID_MAP.has(connectingPlaceId)) {
          const universeId =
            await openCloud.getUniverseIdFromPlaceId(connectingPlaceId);

          if (!universeId) {
            throw new MError({
              message: "Invalid roblox-id header. Place does not exist.",
              code: "UNAUTHORIZED",
            });
          }

          PLACE_ID_TO_UNIVERSE_ID_MAP.set(connectingPlaceId, universeId);
        }

        const universeId = PLACE_ID_TO_UNIVERSE_ID_MAP.get(connectingPlaceId)!;

        if (universeId !== project?.universeId) {
          throw new MError({
            message:
              "Invalid roblox-id header. Place is not controlled by the correct universe.",
            code: "UNAUTHORIZED",
          });
        }
      }

      if (
        project.studio.plan === "NONE" ||
        (!project.studio.stripeSubscriptionId &&
          project.studio.trialEnds! < new Date())
      ) {
        throw new MError({
          message: "Studio is not subscribed to a plan",
          code: "UNAUTHORIZED",
        });
      }

      await queues.enqueue("updateLastUsed", {
        id: token.id,
        payload: {
          tokenId: token.id,
          timestamp: new Date(),
        },
        override: true,
      });

      // await prisma.token.update({
      //   where: {
      //     id: token.id,
      //   },
      //   data: {
      //     lastUsed: new Date(),
      //   },
      // });

      return { studio, project, openCloud, userId: token.userId };
    }

    throw new MError({
      message: "Invalid Token (No Token Provided)",
      code: "UNAUTHORIZED",
    });
  })
  .onError({ as: "global" }, ({ code, error, set, params }) => {
    // console.error(error);
    if (code === "NOT_FOUND" && !(error instanceof MError)) {
      set.status = 404;

      return {
        code: "NOT_FOUND",
        message: "Route not found",
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;

      const json = JSON.parse(error.message) as {
        at: string;
        message: string;
        on: string;
        property: string;
      };

      // console.log(json);

      return {
        code: "BAD_REQUEST",
        message: "Invalid input",
        details: {
          property: json.property.substring(1),
          on: json.on,
          at: json.at,
          message: json.message,
        },
      };
    }

    if (error instanceof MError) {
      set.status = getHTTPStatusCodeFromError(error);
      set.headers = {
        "Content-Type": "application/json",
      };

      return {
        code: error.code,
        message: error.message,
      };
    }

    set.status = 500;

    console.log(error);

    return {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    };
  })
  .onStop(async () => {
    await queues.close();
    await backgroundJobs.close();
  });

process.on("SIGINT", async () => {
  await queues.close();
  await backgroundJobs.close();
  process.exit();
});
