import { treaty } from "@elysiajs/eden";

import type { App } from "@metrik/api";

import { env } from "@/env.mjs";

interface Authentication {
  method: "apiKey" | "bearer";
  key: string;
}

function getEnv() {
  if (!env.VERCEL_ENV) {
    return "dev";
  }
  if (env.VERCEL_ENV === "production") {
    return "prod";
  }
  return "staging";
}

export function createAuroraRouter(
  projectId: string,
  authentication: Authentication,
) {
  const environment = getEnv();
  const router = treaty<App>(
    environment === "dev"
      ? "http://localhost:3001"
      : environment === "staging"
        ? "https://api.metrik.app"
        : "https://api-prod.metrik.app",
    {
      headers:
        authentication.method === "apiKey"
          ? { "x-api-key": authentication.key }
          : { Authorization: `Bearer ${authentication.key}` },
    },
  );

  return router.api.v1.projects({ projectId });
}
