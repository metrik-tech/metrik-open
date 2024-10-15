import { Redis } from "@upstash/redis";
import { subDays } from "date-fns";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureWithCustomRateLimit,
  protectedProcedureWithRateLimit,
  TRPCError,
} from "../trpc";

const redis = Redis.fromEnv();

interface UserLookupResponse {
  Keyword: string;
  StartIndex: number;
  MaxRows: number;
  TotalResults: number;
  UserSearchResults:
    | {
        UserId: number;
        Name: string;
        DisplayName: string;
        Blurb: string;
        PreviousUserNamesCsv: string;
        IsOnline: boolean;
        LastLocation: string | null;
        UserProfilePageUrl: string;
        LastSeenDate: string | null;
        PrimaryGroup: string;
        PrimaryGroupUrl: string;
        HasVerifiedBadge: boolean;
      }[]
    | null;
}

const onlyContainsNumbers = (str: string) => /^\d+$/.test(str);

export const commandsRouter = createTRPCRouter({
  userLookup: protectedProcedureWithRateLimit
    .input(
      z.object({
        search: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const redisQuery = await redis.get<typeof response>(
        `user-search:${encodeURIComponent(input.search)}`,
      );

      if (redisQuery) {
        return {
          users: redisQuery,
          search: input.search,
        };
      }

      const req = await fetch(
        `https://www.roblox.com/search/users/results?keyword=${encodeURIComponent(
          input.search,
        )}&maxRows=5&startIndex=0`,
        {
          headers: {
            "User-Agent": "Metrik/1.0",
          },
        },
      );

      if (!req.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to lookup user",
        });
      }

      const json = (await req.json()) as UserLookupResponse;

      if (!json.UserSearchResults) {
        return {
          users: [],
          search: input.search,
        };
      }

      const response = json.UserSearchResults.map((user) => ({
        userId: user.UserId,
        username: user.Name,
        avatarUrl: `https://thumbs.metrik.app/headshot/${user.UserId}`,
        displayName: user.DisplayName,
        idMatch: false,
      }));

      if (onlyContainsNumbers(input.search)) {
        console.log("ONLY NUMS");
        const userReq = await fetch(
          `https://users.roblox.com/v1/users/${input.search}`,
          {
            headers: {
              "User-Agent": "Metrik/1.0",
            },
          },
        );

        if (userReq.ok) {
          console.log("OK", input.search);
          const userJson = (await userReq.json()) as {
            id: number;
            name: string;
            displayName: string;
          };

          response.unshift({
            userId: userJson.id,
            username: userJson.name,
            avatarUrl: `https://thumbs.metrik.app/headshot/${userJson.id}`,
            displayName: userJson.displayName,
            idMatch: true,
          });
          if (response.length > 5) {
            response.pop();
          }
        }
      }

      await redis.set(
        `user-search:${encodeURIComponent(input.search)}`,
        response,
        {
          ex: 60 * 60 * 24 * 31,
        },
      );

      return {
        users: response,
        search: input.search,
      };
    }),
  getRobloxUser: protectedProcedureWithCustomRateLimit(1000, 20)
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return getRobloxUser(input.userId);
    }),
  getNoSDKDetection: protectedProcedure
    .input(
      z.object({
        projectId: z.string().trim(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.createdAt < subDays(new Date(), 14)) {
        return false;
      }

      const latestAnalytic = await ctx.prisma.analytic.findFirst({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      if (!latestAnalytic) {
        return false;
      }

      if (latestAnalytic.serverCount === 0 && latestAnalytic.playerCount > 0) {
        return true; // Game is getting players but no server count, likely no SDK
      }
    }),
});

export async function getRobloxUser(userId: number) {
  const redisQuery = await redis.get<typeof response>(`get-user:${userId}`);

  if (redisQuery) {
    return redisQuery;
  }

  const req = await fetch(`https://users.roblox.com/v1/users/${userId}`, {
    headers: {
      "User-Agent": "Metrik/1.0",
    },
  });

  if (!req.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get user",
    });
  }

  const json = (await req.json()) as {
    id: number;
    name: string;
    displayName: string;
  };

  const response = {
    userId: json.id,
    username: json.name,
    avatarUrl: `https://thumbs.metrik.app/headshot/${json.id}`,
    displayName: json.displayName,
    idMatch: false,
  };

  await redis.set(`get-user:${userId}`, response, {
    ex: 60 * 60 * 24 * 31,
  });

  return response;
}
