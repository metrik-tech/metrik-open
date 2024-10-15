import { Discord, generateState } from "arctic";
import { Client } from "discord.js";
import { z } from "zod";

import { getBaseUrl } from "@/utils/api";
import { createTRPCRouter, protectedProcedure, TRPCError } from "../trpc";

export const discord = new Discord(
  process.env.DISCORD_CLIENT_ID!,
  process.env.DISCORD_CLIENT_SECRET!,
  `${getBaseUrl()}/api/discord/callback`,
);

export const usersRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          memberships: {
            some: {
              studio: {
                membership: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
              },
            },
          },
        },
      });
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findMany({
        where: {
          id: {
            in: input.ids,
          },
          memberships: {
            some: {
              studio: {
                membership: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
              },
            },
          },
        },
      });
    }),
  getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        onboarded: true,
      },
    });

    return user?.onboarded ?? false;
  }),
  linkDiscordAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session.user.id,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User not found",
      });
    }

    if (user.discordId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User already linked to Discord",
      });
    }

    const state = generateState();

    const link = await discord.createAuthorizationURL(state, {
      scopes: ["identify"],
    });

    return link.href;
  }),
  removeDiscordAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session.user.id,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User not found",
      });
    }

    if (!user.discordId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User not linked to Discord",
      });
    }

    await ctx.prisma.user.update({
      where: {
        id: ctx.session.user.id,
      },
      data: {
        discordId: null,
      },
    });

    return;
  }),
  getDiscordAccount: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session.user.id,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User not found",
      });
    }

    if (!user.discordId) {
      return null;
    }

    const req = await fetch(
      `https://discord.com/api/v10/users/${user.discordId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
      },
    );

    if (!req.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch Discord account",
      });
    }

    const json = (await req.json()) as {
      id: string;
      username: string;
      avatar: string;
    };

    return {
      username: json.username,
      avatar: json.avatar
        ? `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}`
        : null,
    };
  }),
});
