import { prisma } from "@metrik/db";

const analytic = await prisma.analytic.findFirst();

console.log(typeof analytic?.timestamp);
