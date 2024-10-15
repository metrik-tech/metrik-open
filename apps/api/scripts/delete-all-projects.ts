import { prisma } from "@metrik/db";

const del = await prisma.project.deleteMany();

console.log(del);
