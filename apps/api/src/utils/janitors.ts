import { prisma } from "@metrik/db";

export const actionJanitor = async (serverId: string) => {
  const actions = await prisma.action.findMany({
    where: {
      serverIds: {
        array_contains: serverId,
      },
    },
  });

  const transactions = actions.map((action) => {
    // if (action.serverIds.length <= 1) {
    //   return prisma.action.delete({
    //     where: {
    //       id: action.id,
    //     },
    //   });
    // }

    return prisma.action.update({
      where: {
        id: action.id,
      },
      data: {
        serverIds:
          (action.serverIds as string[])?.filter((s) => s !== serverId) ?? [],
      },
    });
  });

  await prisma.$transaction(transactions);
};

export const logJanitor = async (serverId: string) => {
  const logs = await prisma.error.findMany({
    where: {
      serverIds: {
        some: {
          serverId,
        },
      },
    },
    include: {
      serverIds: true,
    },
  });

  const transactions = logs.map((log) => {
    return prisma.error.update({
      where: {
        id: log.id,
      },
      data: {
        serverIds: {
          delete: {
            id: log.serverIds.find((s) => s.serverId === serverId)?.id,
          },
        },
      },
    });
  });

  await prisma.$transaction(transactions);
};
