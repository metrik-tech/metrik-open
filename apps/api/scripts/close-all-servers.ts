import { prisma } from "@metrik/db";

await prisma.activeServer.deleteMany();
