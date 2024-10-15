import { trytm } from "@bdsqqq/try";
import { addDays } from "date-fns";
import { z } from "zod";

import { nid } from "@metrik/id";
import { june } from "@metrik/june";

import { env } from "@/env.mjs";
import {
  createTRPCRouter,
  protectedProcedureWithRateLimit,
  TRPCError,
} from "../trpc";
import {
  createOauthSession,
  create as createProject,
  verifyOpenCloudToken,
  verifyPlace,
  verifyPlaceAndToken,
} from "./projects";
import { create as createStudio } from "./studios";

export const onboardingRouter = createTRPCRouter({
  onboarding: protectedProcedureWithRateLimit
    .input(
      z.object({
        name: z.string().trim().min(3).max(30),
        studioName: z.string().trim().min(3).max(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // const { rootPlaceId, universeId } = await verifyPlaceAndToken(
      //   input.placeId,
      //   input.openCloudToken,
      //   ctx.session,
      // );

      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (user?.studioTrialUsed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Free studio trial already used",
        });
      }

      const projectId = nid();

      const url = await createOauthSession({
        input: {
          name: input.name,

          id: projectId,
          studio: {
            name: input.studioName,
            planSlug: "Trial",
            trialEnd: addDays(new Date(), 14),
          },
          onboarding: true,
        },
        callback: `/projects/${projectId}/analytics?isNewUser=true`,
        session: ctx.session,
      });

      // if (projectError) {
      //   console.log(projectError.message);
      //   if (projectError instanceof TRPCError && studio) {
      //     await ctx.prisma.studio.delete({
      //       where: {
      //         id: studio.id,
      //       },
      //     });

      //     throw new TRPCError({
      //       message: projectError.message,
      //       code: projectError.code,
      //     });
      //   }
      // }

      // await ctx.prisma.user.update({
      //   where: {
      //     id: ctx.session.user.id,
      //   },
      //   data: {
      //     onboarded: true,
      //     studioTrialUsed: true,
      //   },
      // });

      return url.href;
    }),
});
