/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * This is the client-side entrypoint for your tRPC API.
 * It is used to create the `api` object which contains the Next.js
 * App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types
 */
import { QueryCache } from "@tanstack/react-query";
import {
  httpBatchLink,
  httpLink,
  loggerLink,
  splitLink,
  type TRPCClientErrorLike,
} from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import {
  getHTTPStatusCode,
  getHTTPStatusCodeFromError,
} from "@trpc/server/unstable-core-do-not-import";
import { toast } from "sonner";

import { type AppRouter } from "@/server/api/root";
import { TRPCContext } from "@/server/api/trpc";
import { transformer } from "./transformer";

type Maybe<TType> = TType | null | undefined;

const ENDPOINTS = [
  "users",
  "tokens",
  "projects",
  "studios",
  "channels",
  "onboarding",
  "invites",
  "billing",
  "membership",
  "broadcasts",
  "session",
  "aurora",
  "commands",
  "servers",
  "actions",
] as const;
export type Endpoint = (typeof ENDPOINTS)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolveEndpoint = (links: any) => {
  // TODO: Update our trpc routes so they are more clear.
  // This function parses paths like the following and maps them
  // to the correct API endpoints.
  // - viewer.me - 2 segment paths like this are for logged in requests
  // - viewer.public.i18n - 3 segments paths can be public or authed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ctx: any) => {
    const parts = ctx.op.path.split(".");
    let endpoint;
    let path = "";
    if (parts.length == 2) {
      endpoint = parts[0] as keyof typeof links;
      path = parts[1];
    } else {
      endpoint = parts[1] as keyof typeof links;
      path = parts.splice(2, parts.length - 2).join(".");
    }

    return links[endpoint]({ ...ctx, op: { ...ctx.op, path } });
  };
};

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV === "preview")
    return `https://preview.metrik.app`; // SSR should use vercel url
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV === "production")
    return `https://alpha.metrik.app`; // SSR should use vercel url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  transformer,
  config() {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/rpc`;

    return {
      queryClientConfig: {
        defaultOptions: {
          queries: {
            /**
             * Retry `useQuery()` calls depending on this function
             */
            retry(failureCount, _err) {
              const err = _err as never as Maybe<
                TRPCClientErrorLike<AppRouter>
              >;
              const code = err?.data?.code;

              if (
                code === "BAD_REQUEST" ||
                code === "FORBIDDEN" ||
                code === "UNAUTHORIZED" ||
                code === "TOO_MANY_REQUESTS"
              ) {
                // if input data is wrong or you're not authorized there's no point retrying a query
                return false;
              }
              const MAX_QUERY_RETRIES = 3;
              return failureCount < MAX_QUERY_RETRIES;
            },

            staleTime: 1000,
          },
        },
      },

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       * */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),

        splitLink({
          // check for context property `skipBatch`
          condition: (op) => !!op.context.skipBatch,
          // when condition is true, use normal request
          true: (runtime) => {
            const links = Object.fromEntries(
              ENDPOINTS.map((endpoint) => [
                endpoint,
                httpLink({ url: `${url}/${endpoint}`, transformer })(runtime),
              ]),
            );
            return resolveEndpoint(links);
          },
          // when condition is false, use batch request
          false: (runtime) => {
            const links = Object.fromEntries(
              ENDPOINTS.map((endpoint) => [
                endpoint,
                httpBatchLink({ url: `${url}/${endpoint}`, transformer })(
                  runtime,
                ),
              ]),
            );
            return resolveEndpoint(links);
          },
        }),
      ],
    };
  },

  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;
