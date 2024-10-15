import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { getAll } from "@vercel/edge-config";
import { Logger } from "next-axiom";

import { prisma } from "@metrik/db/edge";

import { env } from "@/env.mjs";
import { auth } from "./server/auth";
import { getConfig } from "./server/config";

type MiddlewareContext = NextFetchEvent & {
  params: Record<string, string | string[]>;
};

export default (req: NextRequest, ctx: MiddlewareContext) => {
  const path = req.nextUrl.pathname;
  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/_vercel") ||
    path.startsWith("/static") ||
    path.startsWith("/auth/too-new")
  ) {
    return NextResponse.next();
  }

  return auth(async (req) => {
    const logger = new Logger({ source: "middleware" });
    logger.middleware(req);
    const config = await getConfig();
    ctx.waitUntil(logger.flush());

    const session = req.auth;

    if (session?.user) {
      if (session?.user.robloxId)
        if (config.bannedUsers.includes(Number(session?.user.robloxId))) {
          return NextResponse.rewrite(
            new URL(`/auth/banned?user=${session?.user.name}`, req.url),
          );
        }

      if (
        env.VERCEL_ENV === "preview" &&
        !config.previewEnvAccess.includes(Number(session?.user.robloxId))
      ) {
        return NextResponse.rewrite(
          new URL(`/auth/preview?user=${session?.user.name}`, req.url),
        );
      }

      if (
        req.method === "GET" &&
        !session?.user.onboarded &&
        !["/onboarding", "/user/settings"].includes(path)
      ) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      // if (!config.earlyAccess.includes(Number(session?.user.robloxId))) {
      //   return NextResponse.rewrite(new URL("/auth/waitlist", req.url));
      // }

      if (path.startsWith("/projects")) {
        const studio = await prisma.studio.findFirst({
          where: {
            membership: {
              some: {
                userId: session.user.id,
              },
            },
            projects: {
              some: {
                id: path.split("/")[2],
              },
            },
          },
          select: {
            stripeSubscriptionId: true,
            trialEnds: true,
            plan: true,
          },
        });

        if (!studio) {
          return NextResponse.redirect(new URL("/", req.url));
        }

        if (
          (!studio.stripeSubscriptionId && studio.trialEnds! < new Date()) ||
          studio.plan === "NONE"
        ) {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
    }

    if (!session?.user && path !== "/auth/login") {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${path}`, req.url),
      );
    } else if (session?.user && path === "/auth/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  })(req, ctx);
};
