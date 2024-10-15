import { z } from "zod";

import { createAuroraRouter } from "../aurora";
import { createTRPCRouter, protectedProcedure, TRPCError } from "../trpc";

export async function getPlacesInUniverse(universeId: string, cursor?: string) {
  const placesInUniverse = await fetch(
    `https://develop.roblox.com/v1/universes/${universeId}/places?sortOrder=Asc&limit=100&cursor=${cursor ?? ""}&isUniverseCreation=false`,
  );

  const places = (await placesInUniverse.json()) as {
    nextPageCursor: string | null;
    data: {
      id: number;
      name: string;
      universeId: string;
      description: string;
    }[];
  };

  if (places.nextPageCursor) {
    const nextPage = await getPlacesInUniverse(places.nextPageCursor);
    places.data.push(...nextPage.data);
  }

  return places;
}

async function getUsers(userIds: number[]) {
  const users = await fetch(`https://users.roblox.com/v1/users`, {
    method: "POST",
    body: JSON.stringify({
      userIds: userIds.map((id) => String(id)),
      excludeBannedUsers: true,
    }),
  });

  const data = (await users.json()) as {
    data: {
      id: number;
      name: string;
      displayName: string;
    }[];
  };

  return data;
}

export const serversRouter = createTRPCRouter({
  getAllServers: protectedProcedure
    .input(
      z.object({
        // filter
        size: z.number().default(10),
        page: z.number().default(0),
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          studio: {
            membership: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const [servers, places] = await Promise.all([
        ctx.prisma.activeServer.findMany({
          where: {
            projectId: input.projectId,
          },
          take: input.size,
          skip: (input.page ?? 0) * (input.size ?? 10),
        }),
        getPlacesInUniverse(project.universeId),
      ]);

      return servers.map((server) => {
        return {
          ...server,
          placeName: places.data.find(
            (place) => String(place.id) === server.placeId,
          )?.name,
        };
      });
    }),
  getServer: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const server = await ctx.prisma.activeServer.findFirst({
        where: {
          id: input.id,
          project: {
            studio: {
              membership: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
        include: {
          project: true,
        },
      });

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      const [places, users, prismaTransaction] = await Promise.all([
        getPlacesInUniverse(server.project.universeId),
        getUsers(server.players),
        ctx.prisma.$transaction([
          ctx.prisma.action.findMany({
            where: {
              serverIds: {
                array_contains: server?.serverId,
              },
            },
          }),
          ctx.prisma.issue.findMany({
            where: {
              errors: {
                some: {
                  serverIds: {
                    some: {
                      serverId: server?.serverId,
                    },
                  },
                },
              },
            },
          }),
        ]),
      ]);

      const [actions, issues] = prismaTransaction;

      return {
        ...server,
        placeName: places.data.find(
          (place) => String(place.id) === server.placeId,
        )?.name,
        players: users.data.map((user) => ({
          ...user,
          thumbnail: `https://thumbs.metrik.app/headshot/${user.id}`,
        })),
        actions,
        issues,
      };
    }),

  getPageCount: protectedProcedure
    .input(
      z.object({
        // filter
        projectId: z.string(),
        size: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const count = await ctx.prisma.activeServer.count({
        where: {
          projectId: input.projectId,
        },
      });
      return Math.ceil(count / input.size);
    }),
  stopServer: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const server = await ctx.prisma.activeServer.findFirst({
        where: {
          id: input.id,
          project: {
            studio: {
              membership: {
                some: {
                  role: {
                    in: ["OWNER", "ADMIN"],
                  },
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
      });

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      const aurora = createAuroraRouter(server?.projectId, {
        method: "bearer",
        key: ctx.token,
      });

      try {
        await aurora.server.stop.post({ serverId: server.serverId });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error stopping server",
        });
      }

      return;
    }),
});
