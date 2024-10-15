import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@metrik/db";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (token !== process.env.DISCORD_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      discordId: req.nextUrl.searchParams.get("id"),
    },
  });

  return NextResponse.json(user);
}
