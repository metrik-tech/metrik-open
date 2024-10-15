import { type NextRequest } from "next/server";
import { type AnyRouter } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import * as trpcNext from "@trpc/server/adapters/next";
import { Logger } from "next-axiom";
import { z } from "zod";

import { env } from "@/env.mjs";
import { auth } from "../auth";
import { createTRPCContext } from "./trpc";

export const fetchHandler = (router: AnyRouter, endpoint: string) =>
  auth(async (req) => {
    const logger = new Logger({ source: `trpc/${endpoint}` });

    const response = fetchRequestHandler({
      endpoint: `/rpc/${endpoint}`,
      req,
      router,

      createContext: () =>
        createTRPCContext({ req, session: req.auth, logger }),
      onError:
        env.NODE_ENV === "development"
          ? ({ path, error }) => {
              console.error(
                `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
              );
            }
          : undefined,

      batching: {
        enabled: true,
      },
    });

    await logger.flush();

    return response;
  });
