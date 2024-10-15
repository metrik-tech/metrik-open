import * as argon2 from "argon2";
import { z } from "zod";

import { nid } from "@metrik/id";

import { env } from "@/env.mjs";
import { createTRPCRouter, protectedProcedure, TRPCError } from "../trpc";

const randomHex = (bytes = 32) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");

export const tokensRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        studioId: z.string(),
        projectId: z.string(),
        expiry: z.date().optional(),
        nickname: z.string().trim().max(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          membership: true,
        },
      });

      if (!studio) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving studio",
        });
      }

      const membership = studio.membership.find(
        (m) => m.userId === ctx.session.user.id,
      );

      if (!["OWNER", "ADMIN"].includes(membership?.role ?? "USER")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient permissions",
        });
      }

      const [project, tokenCount] = await ctx.prisma.$transaction([
        ctx.prisma.project.findFirst({
          where: {
            id: input.projectId,
            studioId: input.studioId,
          },
        }),
        ctx.prisma.token.count({
          where: {
            projectId: input.projectId,
          },
        }),
      ]);

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving project",
        });
      }

      if (tokenCount >= 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Too many tokens",
        });
      }

      

      const rawToken = `mtrk_${randomHex()}`;

      const hashedToken = await argon2.hash(rawToken, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 2,
        parallelism: 1,
      });

      const token = await ctx.prisma.token.create({
        data: {
          id: nid(),
          nickname: input.nickname,
          projectId: input.projectId,
          expiry: input.expiry,
          userId: ctx.user.robloxId,
          hashedToken,
          prefix: rawToken.slice(0, 11),
        },
      });

      return {
        rawToken,
        token,
      };
    }),
  getAll: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          studio: {
            membership: {
              some: {
                userId: ctx.session.user.id,
                role: {
                  not: {
                    equals: "USER",
                  },
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving project",
        });
      }

      const tokens = await ctx.prisma.token.findMany({
        where: {
          projectId: input.projectId,
        },
      });

      return tokens.map(({ hashedToken, ...rest }) => rest);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const token = await ctx.prisma.token.findFirst({
        where: {
          id: input.id,
          project: {
            studio: {
              membership: {
                some: {
                  userId: ctx.session.user.id,
                  role: {
                    not: {
                      equals: "USER",
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error resolving token",
        });
      }

      await ctx.prisma.token.delete({
        where: {
          id: input.id,
        },
      });

      return true;
    }),
});
