import { NextResponse, type NextRequest } from "next/server";
import { trytm } from "@bdsqqq/try";
import { Redis } from "@upstash/redis";
import { Roblox } from "arctic";
import { addDays, addHours, addMonths } from "date-fns";

import { prisma } from "@metrik/db";
import { type Studio } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { env } from "@/env.mjs";
import {
  create as createStudio,
  type CreateStudio,
} from "@/server/api/routers/studios";
import { auth } from "@/server/auth";
import { getBaseUrl } from "@/utils/api";
import { normalize } from "@/utils/ascii";
import { log } from "@/utils/log";

const redis = Redis.fromEnv();

interface Input {
  codeVerifier: string;
  input: {
    name: string;
    id: string;
    studioId?: string;
    studio?: CreateStudio["input"];
    onboarding?: boolean;
  };
  callback: string | null;
  noCreate: boolean;
}

const redirect = (url: string) =>
  NextResponse.redirect(`${getBaseUrl()}${url}`);

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const input = await redis.get<Input>(
    `project:${req.nextUrl.searchParams.get("state")}`,
  );

  if (!input) {
    return redirect("/new/project/failed?error=state_empty");
  }

  const roblox = new Roblox(
    env.ROBLOX_CLIENT_ID,
    env.ROBLOX_CLIENT_SECRET,
    `${getBaseUrl()}/api/projects/callback`,
  );

  const [tokens, tokensError] = await trytm(
    roblox.validateAuthorizationCode(
      req.nextUrl.searchParams.get("code")!,
      input.codeVerifier,
    ),
  );

  if (tokensError) {
    console.log(tokensError);
    return redirect(`${input.callback}?error=tokens_invalid`);
  }

  const resources = await fetch(
    `https://apis.roblox.com/oauth/v1/token/resources`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: tokens.accessToken,
        client_id: env.ROBLOX_CLIENT_ID,
        client_secret: env.ROBLOX_CLIENT_SECRET,
      }),
    },
  );

  if (!resources.ok) {
    return redirect(`${input.callback}?error=resources_api_error`);
  }

  const resourcesJson = (await resources.json()) as {
    resource_infos: {
      resources: {
        universe: {
          ids: string[];
        };
      };
    }[];
  };

  const ids = resourcesJson.resource_infos.flatMap(
    (info) => info.resources.universe.ids,
  );

  if (!ids.length) {
    return redirect(`${input.callback}?error=resources_not_granted`);
  }

  await redis.del(`project:${req.nextUrl.searchParams.get("state")}`);

  const details = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${ids[0]}`,
  );

  const detailsJson = (await details.json()) as {
    data: {
      rootPlaceId: number;
    }[];
  };

  const makeStudio = !!input.input.studio && !input.input.studioId;

  const existingProject = await prisma.project.findFirst({
    where: {
      universeId: ids[0],
    },
    include: {
      openCloudToken: true,
    },
  });

  if (existingProject) {
    if (
      !input.input.studioId &&
      existingProject.studioId !== input.input.studioId
    ) {
      return redirect(`${input.callback}?error=project_already_exists`);
    }

    await prisma.project.update({
      data: {
        openCloudError: false,
        openCloudSession: {
          update: {
            where: {
              projectId: existingProject.id,
            },
            data: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              accessTokenExpires: tokens.accessTokenExpiresAt,
              refreshTokenExpires: addMonths(new Date(), 6),
            },
          },
        },
      },
      where: {
        id: existingProject.id,
      },
    });

    if (existingProject.openCloudToken) {
      await prisma.openCloudToken.delete({
        where: {
          projectId: existingProject.id,
          token: existingProject.openCloudToken.token,
        },
      });
    }

    return redirect(
      input.callback ?? `/projects/${existingProject.id}/analytics`,
    );
  }

  if (input.noCreate) {
    return redirect(`/new/project/failed?error=create_not_allowed`);
  }

  let studio: Studio | undefined;

  if (input.input.onboarding) {
    studio = await createStudio({
      input: input.input.studio!,
      user: {
        id: req.auth?.user.id,
      },
    });

    await prisma.user.update({
      where: {
        id: req.auth?.user.id,
      },
      data: {
        studioTrialUsed: true,
        onboarded: true,
      },
    });

    await log({
      message: "Onboarding completed",
      data: [
        {
          name: "User",
          value: req.auth?.user.name ?? "Unknown",
        },
        {
          name: "Studio",
          value: input.input.studio?.name ?? "Unknown",
        },
        {
          name: "Studio ID",
          value: input.input.studioId ?? "Unknown",
        },
        {
          name: "View on Roblox",
          value: `https://www.roblox.com/users/${req.auth?.user.robloxId}/profile`,
        },
      ],
    });
  }

  const newProject = await prisma.project.create({
    data: {
      id: nid(),
      name: normalize(input.input.name),
      universeId: ids[0]!,
      placeId: String(detailsJson.data[0]!.rootPlaceId),
      studioId: studio ? studio.id : input.input.studioId!,
      openCloudSession: {
        create: {
          id: nid(),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpires: tokens.accessTokenExpiresAt,
          refreshTokenExpires: addMonths(new Date(), 6),
        },
      },
    },
  });

  return redirect(input.callback ?? `/projects/${newProject.id}/analytics`);
});
