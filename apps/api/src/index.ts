import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import {
  getHTTPStatusCodeFromError,
  TRPC_ERROR_CODES_BY_KEY,
} from "@trpc/server/unstable-core-do-not-import";
import { Server } from "bun";
import { Elysia } from "elysia";
import { rateLimit as elysiaRateLimit } from "elysia-rate-limit";

import { jobRouter } from "./jobs";
import { relatioRouter } from "./relatio";
import { actionsRouter } from "./routers/actions";
import { analyticsRouter } from "./routers/analytics";
import { broadcastsRouter } from "./routers/broadcasts";
import { flagsRouter } from "./routers/flags";
import { logsRouter } from "./routers/logs";
import { moderationRouter } from "./routers/moderation";
import { proxyRouter } from "./routers/proxy";
import { serversRouter } from "./routers/servers";
import { MError } from "./utils/error";
import { consola } from "./utils/log";
import { RedisContext } from "./utils/ratelimit-context";
import { redisFactory } from "./utils/redis";

export type App = typeof app;

export const app = new Elysia()
  .use(
    elysiaRateLimit({
      duration: 5000,
      max: 25,
      responseMessage: {
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit reached. Slow down.",
      } as MError,
      generator: (req, server) =>
        req.headers.get("CF-Connecting-IP") ??
        server?.requestIP(req)?.address ??
        "",
      // context: new RedisContext(),
      // TODO: Write a Redis based context so we can use multiple servers, does not need to be implemented yet
      // TODO: (continued) but it would be nice to have something easy to drop in
    }),
  )
  .use(cors())
  .use(
    swagger({
      exclude: [
        "/api/relatio/promo/generate",
        "/api/relatio/promo/revoke",
        "/api/relatio/promo/check",
      ],

      documentation: {
        info: {
          title: "Metrik Aurora",
          description: "",
          version: "0.0.0",
        },

        components: {
          schemas: {
            Error: {
              type: "object",
              properties: {
                code: {
                  enum: Object.keys(TRPC_ERROR_CODES_BY_KEY),
                  type: "string",
                },
                message: {
                  type: "string",
                },
              },
            },
          },
          securitySchemes: {
            Token: {
              type: "apiKey",
              name: "x-api-key",
              in: "header",
            },
          },
        },
      },
    }),
  )
  .use(jobRouter)

  .group("/api/v1/projects/:projectId", (app) => {
    return (
      app
        .use(actionsRouter)
        .use(analyticsRouter)
        .use(broadcastsRouter)
        .use(logsRouter)
        // .use(moderationRouter)
        .use(serversRouter)
        .use(flagsRouter)
        .use(proxyRouter)
    );
  })
  .use(relatioRouter)
  .onError({ as: "global" }, ({ code, error, set, params }) => {
    if (code === "NOT_FOUND" && !(error instanceof MError)) {
      set.status = 404;

      return {
        code: "NOT_FOUND",
        message: "Route not found",
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;

      const json = JSON.parse(error.message) as {
        at: string;
        message: string;
      };

      console.log(json, "validation");

      return {
        code: "BAD_REQUEST",
        message: "Invalid input",
        details: {
          at: json.at,
          message: json.message,
        },
      };
    }

    if (error instanceof MError) {
      set.status = getHTTPStatusCodeFromError(error);

      return {
        code: error.code,
        message: error.message,
      };
    }

    set.status = 500;

    console.log(error);

    return {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    };
  })
  .listen(3001, (server) => {
    consola.info(`Listening on http://localhost:${server.port}`);
  });
