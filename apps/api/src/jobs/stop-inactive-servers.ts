import consola from "consola";

import { actionJanitor, logJanitor } from "../utils/janitors";
import { prisma } from "@metrik/db";

import { CronJob as QuirrelJob } from "quirrel/next-app"
import { CronJob } from "../utils/cron";


export const stopInactiveServersJob = CronJob("jobs/stop-inactive-servers", "*/30 * * * *", async () => {
  const inactiveServers = await prisma.activeServer.findMany({
    where: {
      lastPing: {
        // inactive for 1 hour
        lte: new Date(Date.now() - 1000 * 60 * 60),
      },
    },
  });

  await Promise.all(
    inactiveServers.map(async (server) => {
      await actionJanitor(server.id);
      await logJanitor(server.id);
    }),
  );

  await prisma.activeServer.deleteMany({
    where: {
      id: {
        in: inactiveServers.map((server) => server.id),
      },
    },
  });

  consola.info(`Stopped ${inactiveServers.length} inactive server(s)`);
})
