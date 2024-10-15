import { NextResponse } from "next/server";

import { prisma } from "@metrik/db";

import { discord } from "@/server/api/routers/users";
import { auth } from "@/server/auth";
import { getBaseUrl } from "@/utils/api";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tokens = await discord.validateAuthorizationCode(code);

  const user = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  if (!user.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = (await user.json()) as {
    id: string;
  };

  await prisma.user.update({
    where: {
      id: req.auth?.user.id,
    },
    data: {
      discordId: id,
    },
  });

  return NextResponse.redirect(`${getBaseUrl()}/user/settings`);
});
