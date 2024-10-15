import { prisma } from "@metrik/db";
import { type User } from "@metrik/db/client";

export async function getLinkedUser(id: string) {
  const user = await prisma.user.findFirst({
    where: {
      discordId: id,
    },
  });

  return user;
}
