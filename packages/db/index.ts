import { Client } from "@planetscale/database";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";
import { PrismaClient } from "@prisma/client";
import { fieldEncryptionExtension } from "prisma-field-encryption";

function getPrisma() {
  const client = new Client({
    url: process.env.PLANETSCALE_URL,
  });

  const adapter = new PrismaPlanetScale(client);

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    adapter: adapter,
  }).$extends(fieldEncryptionExtension());
}

export type ExtendedPrismaClient = ReturnType<typeof getPrisma>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? getPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
