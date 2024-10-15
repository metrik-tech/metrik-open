import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_S3_ENDPOINT: z.string().min(1),
  },
  runtimeEnv: {
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_S3_ENDPOINT: process.env.R2_S3_ENDPOINT,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
