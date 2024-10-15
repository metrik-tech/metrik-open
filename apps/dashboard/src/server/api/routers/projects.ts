import { randomBytes } from "crypto";
import { Redis } from "@upstash/redis";
import { generateCodeVerifier, generateState, Roblox } from "arctic";
import type { Session } from "next-auth";
import { StringValidation, z } from "zod";

import { prisma } from "@metrik/db";
import { AuditType, MembershipRole, type Studio } from "@metrik/db/client";
import { nid } from "@metrik/id";
import { june } from "@metrik/june";

import { env } from "@/env.mjs";
import { getBaseUrl } from "@/utils/api";
import { normalize } from "@/utils/ascii";
import { logItem } from "@/utils/audit-log";
import { log } from "@/utils/log";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureWithRateLimit,
  publicProcedure,
  TRPCError,
  type TRPCContext,
} from "../trpc";
import { type CreateStudio } from "./studios";

interface CachedExperience {
  name: string;
  creatorName: string;
  creatorType: "User" | "Group";
  creatorId: string;
}

interface Creator {
  name: string;
  type: "User" | "Group";
  id: number;
}

interface Experience {
  name: string;
  creator: Creator;
}

export const projectsRouter = createTRPCRouter({
  verifyPlace: protectedProcedureWithRateLimit
    .input(z.object({ id: z.string().trim() }))
    .query(async ({ ctx, input }) => {
      return verifyPlace(input.id, ctx.session);
    }),

  getExperience: protectedProcedureWithRateLimit
    .input(z.object({ id: z.string().trim() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          studio: {
            membership: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        select: {
          universeId: true,
          id: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving project",
        });
      }

      const experience = await fetch(
        `https://games.roblox.com/v1/games?universeIds=${project.universeId}`,
      );

      interface GameResponse {
        data?: Experience[];
        errors?: {
          message: string;
        }[];
      }

      const experienceJson = (await experience.json()) as GameResponse;

      if (experienceJson.errors ?? !experienceJson?.data?.[0]?.name) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error resolving experience details",
        });
      }

      const data = {
        name: experienceJson?.data?.[0]?.name,
        creatorName:
          experienceJson?.data?.[0]?.creator.type === "User"
            ? `@${experienceJson?.data?.[0]?.creator.name}`
            : experienceJson?.data?.[0]?.creator.name,
        creatorType: experienceJson?.data?.[0]?.creator.type,
        creatorId: experienceJson?.data?.[0]?.creator.id.toString(),
      };

      return data;
    }),

  create: protectedProcedureWithRateLimit
    .input(
      z.object({
        name: z.string().min(3).max(30).trim(),
        // placeId: z.number(),
        // openCloudToken: z.string().trim(),
        studioId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return (await createOauthSession({ input, session: ctx.session })).href;
    }),

  update: protectedProcedureWithRateLimit
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(3).max(30).trim(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          studio: {
            membership: {
              some: {
                role: {
                  not: MembershipRole.USER,
                },
                userId: ctx.session.user.id,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving project",
        });
      }

      // await logItem(AuditType.RENAME_PROJECT, {
      //   userId: ctx.session.user.id,
      //   studioId: project.studioId,
      //   subject: `${input.name}`,
      // });

      return ctx.prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          name: normalize(input.name),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          studio: {
            membership: {
              some: {
                role: MembershipRole.OWNER,
                userId: ctx.session.user.id,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving project",
        });
      }

      // await ctx.prisma.$transaction([
      //   ctx.prisma.analytic.deleteMany({
      //     where: {
      //       projectId: input.id,
      //     },
      //   }),
      //   ctx.prisma.clientAnalytic.deleteMany({
      //     where: {
      //       projectId: input.id,
      //     },
      //   }),
      //   ctx.prisma.log.deleteMany({
      //     where: {
      //       projectId: input.id,
      //     },
      //   }),
      //   ctx.prisma.notificationChannel.deleteMany({
      //     where: {
      //       projectId: input.id,
      //     },
      //   }),
      // ]);

      // await logItem(AuditType.DELETE_PROJECT, {
      //   userId: ctx.session.user.id,
      //   studioId: project.studioId,
      //   subject: project.name,
      // });

      return ctx.prisma.project.delete({
        where: {
          id: project.id,
        },
      });
    }),

  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          studio: {
            membership: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          studio: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving project",
        });
      }

      return project;
    }),

  getAll: protectedProcedure
    .input(z.object({ studioId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.project.findMany({
        where: {
          studioId: input.studioId,
          studio: {
            membership: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });
    }),
});

export async function create({
  ctx,
  input,
  place,
}: {
  ctx: TRPCContext;
  input: {
    name: string;
    placeId: number;
    openCloudToken: string;
    studioId: string;
  };
  place?: {
    rootPlaceId: number;
    universeId: number;
  };
}) {
  const { rootPlaceId, universeId } = place
    ? place
    : await verifyPlaceAndToken(
        input.placeId,
        input.openCloudToken,
        ctx.session,
      );

  const [projectCount, studio] = await ctx.prisma
    .$transaction([
      ctx.prisma.project.count({
        where: {
          studio: {
            id: input.studioId,
            membership: {
              some: {
                role: MembershipRole.OWNER,
                userId: ctx.session.user.id,
              },
            },
          },
        },
      }),
      ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              role: MembershipRole.OWNER,
              userId: ctx.session.user.id,
            },
          },
        },
      }),
    ])
    .catch(() => {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    });

  if (!studio) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Error resolving studio",
    });
  }

  if (projectCount >= 3) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You have reached the maximum amount of projects",
    });
  }

  // await logItem(AuditType.CREATE_PROJECT, {
  //   userId: ctx.session.user.id,
  //   studioId: input.studioId,
  //   subject: input.name,
  // });

  const project = await ctx.prisma.project.create({
    data: {
      id: nid(),
      name: normalize(input.name),
      placeId: rootPlaceId.toString(),
      universeId: universeId.toString(),
      openCloudToken: {
        create: {
          token: input.openCloudToken,
        },
      },
      studio: {
        connect: {
          id: input.studioId,
        },
      },
    },
  });

  june.track({
    userId: ctx.session.user.id,
    event: "Project created",
    properties: {
      projectId: project.id,
      name: project.name,
    },
    context: {
      groupId: project.studioId,
    },
  });

  return project;
}

const redis = Redis.fromEnv();

export async function createOauthSession({
  input,
  callback,
  noCreate,
  session,
}: {
  input: {
    name: string;
    studioId?: string;
    id?: string;
    studio?: CreateStudio["input"];
    onboarding?: boolean;
  };
  callback?: string;
  noCreate?: boolean;
  session: Session;
}) {
  console.log("createOauthSession", input);
  if (input.studioId) {
    const [projectCount, studio] = await prisma
      .$transaction([
        prisma.project.count({
          where: {
            studio: {
              id: input.studioId,
              membership: {
                some: {
                  role: MembershipRole.OWNER,
                  userId: session.user.id,
                },
              },
            },
          },
        }),
        prisma.studio.findFirst({
          where: {
            id: input.studioId,
            membership: {
              some: {
                role: MembershipRole.OWNER,
                userId: session.user.id,
              },
            },
          },
        }),
      ])
      .catch(() => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        });
      });

    if (!studio) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Error resolving studio",
      });
    }

    if (projectCount >= 3) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You have reached the maximum amount of projects",
      });
    }
  }

  const scopes = `openid universe-messaging-service:publish`
    //  universe-datastores.objects:read
    //  universe-datastores.objects:create
    //  universe-datastores.objects:update
    //  universe-datastores.objects:delete
    //  universe-datastores.objects:list`
    // .replace(/\n+/g, " ")
    .split(" ");

  const roblox = new Roblox(
    env.ROBLOX_CLIENT_ID,
    env.ROBLOX_CLIENT_SECRET,
    `${getBaseUrl()}/api/projects/callback`,
  );

  const state = generateState();

  const codeVerifier = generateCodeVerifier();
  const authorizationUrl = await roblox.createAuthorizationURL(
    state,
    codeVerifier,
    {
      scopes,
    },
  );

  const value = {
    input,
    codeVerifier,
    id: input.id ?? nid(),
    callback: callback ?? null,
    noCreate: noCreate ?? false,
  };

  await redis.set(`project:${state}`, value, {
    ex: 60 * 15,
  });

  return authorizationUrl;
}

export async function verifyPlace(
  id: number | string,
  session: Session,
): Promise<{
  message: string;
  rootPlaceId: number;
  universeId: number;
  success: boolean;
}> {
  interface PlaceDetails {
    universeId: number;
  }

  const placeDetails: PlaceDetails = await fetch(
    `https://apis.roblox.com/universes/v1/places/${id}/universe`,
  )
    .then((res) => res.json() as Promise<PlaceDetails>)
    .catch((error) => {
      console.error(error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Roblox servers are not responding",
      });
    });

  if (!placeDetails.universeId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Place does not exist",
    });
  }

  const universeId = placeDetails.universeId;

  interface UniverseDetails {
    rootPlaceId: number;
    creator: {
      type: "User" | "Group";
      id: number;
    };
  }

  const universeDetails = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId || ""}`,
  )
    .then((res) => res.json() as Promise<{ data: UniverseDetails[] }>)
    .catch((error) => {
      console.error(error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Roblox servers are not responding",
      });
    });

  const rootPlaceId = universeDetails?.data?.[0]?.rootPlaceId;

  if (
    universeDetails?.data?.[0]?.creator.type === "User" &&
    universeDetails?.data?.[0]?.creator.id.toString() !== session.user.robloxId
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You do not own this place",
    });
  }

  if (universeDetails?.data?.[0]?.creator.type === "Group") {
    interface GroupDetails {
      owner: {
        userId: number;
      };
    }

    const groupDetails = await fetch(
      `https://groups.roblox.com/v1/groups/${universeDetails.data[0].creator.id}`,
    )
      .then((res) => res.json() as Promise<GroupDetails>)
      .catch((error) => {
        console.error(error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Roblox servers are not responding",
        });
      });

    if (groupDetails.owner.userId.toString() !== session.user.robloxId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You do not own this place",
      });
    }
  }

  return {
    message: "Successfully verified!",
    rootPlaceId: rootPlaceId ? rootPlaceId : 0,
    universeId: universeId ? universeId : 0,
    success: true,
  };
}

export async function verifyOpenCloudToken(token: string, universeId: string) {
  const res = await fetch(
    `https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/${encodeURIComponent(
      "metrik:token-validation",
    )}`,
    {
      method: "POST",
      headers: {
        "x-api-key": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "test",
      }),
    },
  );

  if (res.ok) {
    return true;
  }

  if (res.status === 401) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid token",
    });
  }

  const json = (await res.json()) as {
    Error?: string;
    Message?: string;
  };

  if (json.Error) {
    if (json.Error === "InsufficientScope") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Insufficient scopes on token. Make sure it can access the correct universe.",
      });
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: json.Message,
      });
    }
  }
}

export async function verifyPlaceAndToken(
  placeId: number,
  token: string,
  session: Session,
) {
  const { rootPlaceId, universeId } = await verifyPlace(placeId, session);
  const validToken = await verifyOpenCloudToken(token, universeId.toString());

  return {
    rootPlaceId,
    universeId,
    validToken,
  };
}
