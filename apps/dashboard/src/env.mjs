import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    ROBLOX_CLIENT_ID: z.string().min(1),

    ROBLOX_CLIENT_SECRET: z.string().min(1),
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url(),
    ),
    LILY_TOKEN: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().min(1),

    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    INTERCOM_SECRET: z.string().min(1).optional(),

    PLANETSCALE_URL: z.string().min(1),

    DISCORD_LOG_WEBHOOK_URL: z.string().url().optional(),

    API_URL: z.string().url(),

    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  },
  client: {
    NEXT_PUBLIC_STRIPE_KEY: z.string().min(1),
    NEXT_PUBLIC_INTERCOM_APP_ID: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DISCORD_LOG_WEBHOOK_URL: process.env.DISCORD_LOG_WEBHOOK_URL,
    API_URL: process.env.API_URL,
    PLANETSCALE_URL: process.env.PLANETSCALE_URL,
    ROBLOX_CLIENT_ID: process.env.ROBLOX_CLIENT_ID,
    ROBLOX_CLIENT_SECRET: process.env.ROBLOX_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    LILY_TOKEN: process.env.LILY_TOKEN,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    INTERCOM_SECRET: process.env.INTERCOM_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
    NEXT_PUBLIC_INTERCOM_APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
