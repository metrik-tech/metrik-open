import { trytm } from "@bdsqqq/try";
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { z } from "zod";

import { ActionArgumentType } from "@metrik/db/client";

import { env } from "@/env.mjs";
import type { Stripe } from "@/server/stripe";
import { createAuroraRouter } from "../aurora";
import {
  createTRPCRouter,
  onboardedProcedure,
  protectedProcedure,
  TRPCError,
} from "../trpc";
import { getPlacesInUniverse } from "./servers";

export async function getPlaces(placeIds: string[]) {
  const result = await fetch(
    `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeIds.join(",")}`,
  );

  const data = (await result.json()) as {
    placeId: number;
    name: string;
  }[];

  console.log(data);

  return data;
}

export const actionsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
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
                userId: ctx.user.id,
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

      const actions = await ctx.prisma.action.findMany({
        where: {
          projectId: input.projectId,
          project: {
            studio: {
              membership: {
                some: {
                  userId: ctx.user.id,
                },
              },
            },
          },
        },
      });

      const places = await getPlacesInUniverse(project.universeId);

      const actionsWithPlaces = actions.map((action) => {
        const place = places.data.find(
          (place) => String(place.id) === action.placeId,
        );

        return {
          ...action,
          place: {
            id: action.placeId,
            name: place!.name,
          },
        };
      });

      return actionsWithPlaces;
    }),
  get: protectedProcedure
    .input(
      z.object({
        projectId: z.string().trim(),
        actionId: z.string().trim(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const action = await ctx.prisma.action.findFirst({
        where: {
          id: input.actionId,
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
          arguments: true,
        },
      });

      if (!action) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action not found",
        });
      }

      return action;
    }),
  getRun: protectedProcedure
    .input(
      z.object({
        projectId: z.string().trim(),
        runId: z.string().trim().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const run = await ctx.prisma.actionRun.findFirst({
        where: {
          id: input.runId,
          projectId: input.projectId,
          project: {
            studio: {
              membership: {
                some: {
                  userId: ctx.user.id,
                },
              },
            },
          },
        },
        include: {
          details: true,
        },
      });

      return run;
    }),

  run: onboardedProcedure
    .input(
      z.object({
        projectId: z.string().trim(),
        key: z.string().trim(),
        arguments: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
              type: z.nativeEnum(ActionArgumentType),
              array: z.boolean().optional().default(false),
            }),
          )
          .optional(),
        placeId: z.number().int().positive(),
        exclusive: z.boolean().optional().default(false),
        serverIds: z.array(z.string().trim().uuid()).optional(),
        placeVersion: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const aurora = createAuroraRouter(input.projectId, {
        method: "bearer",
        key: ctx.token,
      });

      const response = await aurora.actions.run.post({
        key: input.key,
        arguments: input.arguments,
        placeId: input.placeId,
        exclusive: input.exclusive,
        serverIds: input.serverIds,
        version: input.placeVersion,
      });

      return response.data;
    }),
});
