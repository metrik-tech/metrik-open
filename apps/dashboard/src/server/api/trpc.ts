import type { GetServerSidePropsContext } from "next";
import { type NextRequest } from "next/server";
import { type Studio, type User } from "@prisma/client";
import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getAll } from "@vercel/edge-config";
import { type Session } from "next-auth";
import { type Logger } from "next-axiom";
import superjson from "superjson";
import { ZodError, ZodIssue } from "zod";

import { prisma } from "@metrik/db";
import { createSessionJWT, decode, nextAuthDecoder } from "@metrik/jwt";

import config from "@/utils/config";
import { transformer } from "@/utils/transformer";
import { getConfig } from "../config";
import { stripe } from "../stripe";
import { appRouter } from "./root";

type CreateContextOptions = {
  session: Session | null;
  headers: Headers;
  logger: Logger;
  token: string;
  user: User | null;
};

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    stripe,
    logger: opts.logger,
    config,
    token: opts.token,
    headers: opts.headers,
    user: opts.user,
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>> & {
  session: Session;
};

export const createTRPCContext = async (opts: {
  session: Session | null;
  req: NextRequest;
  logger: Logger;
}) => {
  // Fetch stuff that depends on the request
  return createInnerTRPCContext({
    headers: opts.req.headers,
    logger: opts.logger,

    session: opts.session,
    user: await prisma.user.findFirst({
      where: {
        id: opts.session?.user.id,
      },
    }),
    token: await createSessionJWT({
      cookies: opts.req.cookies
        .getAll()
        .reduce<Record<string, string>>((acc, cookie) => {
          acc[cookie.name] = cookie.value;
          return acc;
        }, {}),
      https: opts.req.nextUrl.protocol === "https:",
      secret: process.env.NEXTAUTH_SECRET as string,
    }),
  });
};

interface ZodErrorMessage {
  message: string;
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer,
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        message: (JSON.parse(error.cause.message) as ZodErrorMessage[])[0]
          ?.message!,
        code: TRPC_ERROR_CODES_BY_KEY.BAD_REQUEST,
      };
    }

    return shape;
  },
});

// export const createCaller = t.createCallerFactory(appRouter);

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;
/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in.
 */
export const publicProcedure = t.procedure;

interface RateLimitOptions {
  intervalInMs: number;
  limit: number;
}
export const rateLimitProcedure = ({ intervalInMs, limit }: RateLimitOptions) =>
  t.middleware(async ({ ctx, next }) => {
    // validate user exists
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${intervalInMs} ms`),
      analytics: false,
      prefix: "general",
    });

    const { success, remaining } = await ratelimit.limit(ctx.session.user.id);

    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
        remaining,
      },
    });
  });

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure.
 */
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { earlyAccess, bannedUsers } = await getConfig();

  if (bannedUsers.includes(Number(ctx.session.user.robloxId))) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Banned" });
  }

  // if (!earlyAccess.includes(Number(ctx.session.user.robloxId))) {
  //   throw new TRPCError({ code: "UNAUTHORIZED", message: "Not whitelisted" });
  // }

  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
      user: ctx.user!,
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees `ctx.session.user` is
 * not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const protectedProcedureWithRateLimit = protectedProcedure.use(
  rateLimitProcedure({ intervalInMs: 1000, limit: 10 }),
);

export const protectedProcedureWithCustomRateLimit = (
  intervalInMs: number,
  limit: number,
) => protectedProcedure.use(rateLimitProcedure({ intervalInMs, limit }));

export const onboardedProcedure = protectedProcedureWithCustomRateLimit(
  1000,
  10,
).use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findFirst({
    where: {
      id: ctx.session.user.id,
    },
    select: {
      onboarded: true,
    },
  });

  if (!user?.onboarded) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not onboarded",
    });
  }

  return next();
});

export const checkPaid = (studio: Studio) => {
  if (
    !studio?.stripeSubscriptionId ||
    (!studio?.stripeSubscriptionId &&
      studio?.trialEnds &&
      studio.trialEnds < new Date())
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You need to be on a paid plan to access this feature",
    });
  }

  return true;
};

export { TRPCError };
