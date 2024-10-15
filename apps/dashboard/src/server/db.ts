import { Client } from "@planetscale/database";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";
import { fieldEncryptionExtension } from "prisma-field-encryption";
import { fetch as undiciFetch } from "undici";

import { PrismaClient } from "@metrik/db/client";

import { env } from "@/env.mjs";

function getPrisma() {
  const connection = new Client({
    url: env.PLANETSCALE_URL,
    fetch: undiciFetch,
  });
  const adapter = new PrismaPlanetScale(connection);
  return new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    adapter: adapter,
  }).$extends(fieldEncryptionExtension());
}

type ExtendedPrismaClient = ReturnType<typeof getPrisma>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? getPrisma();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
