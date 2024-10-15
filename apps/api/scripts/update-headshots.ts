import { prisma } from "@metrik/db";

async function updateHeadshots() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    const robloxId = user.robloxId;
    if (robloxId) {
      const headshot = `https://thumbs.metrik.app/headshot/${robloxId}`;
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          image: headshot,
        },
      });
    }
  }
}

await updateHeadshots();
