import consola from "consola";

import { prisma } from "@metrik/db";
import type { Analytic, Project } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { CronJob as QuirrelJob } from "quirrel/next-app"
import { CronJob } from "../utils/cron";

import { chunk } from "../utils/chunk";

interface BasicStats {
  id: number;
  visits: number;
  playing: number;
  favoritedCount: number;
}
interface Vote {
  id: number;
  upVotes: number;
  downVotes: number;
}

async function writeAnalytic(
  projectId: string,
  analytic: Omit<Analytic, "projectId">,
) {}

export const analyticsJob = CronJob("jobs/analytics", "*/15 * * * *", async () => {
  const projects = await prisma.project.findMany({
    where: {
      studio: {
        NOT: {
          plan: {
            in: ["FREE", "TRIAL"],
          },
          trialEnds: {
            lte: new Date(),
          },
        },
      },
    },
  });

  const projectChunks = chunk(projects, 10) as Project[][];
  consola.info(`Retrieving stats for ${projectChunks.length} chunks`);

  const createQueue = new Set<Analytic>();

  await Promise.all(
    projectChunks.map(async (chunk) => {
      const [games, votes] = await Promise.allSettled([
        fetch(
          `https://games.roblox.com/v1/games?universeIds=${chunk
            .map((project) => project.universeId)
            .join(",")}`,
        ),
        fetch(
          `https://games.roblox.com/v1/games/votes?universeIds=${chunk
            .map((project) => project.universeId)
            .join(",")}`,
        ),
      ]);

      const activeServers = await prisma.$transaction(
        chunk.map((project) => {
          return prisma.activeServer.count({
            where: {
              projectId: project.id,
            },
          });
        }),
      );

      if (games.status === "rejected" || votes.status === "rejected") {
        consola.error(
          games.status === "rejected"
            ? "Failed to fetch games"
            : "Failed to fetch votes",
        );
        return; // Continue to the next iteration
      }

      if (!games.value.ok || !votes.value.ok) {
        consola.error(
          !games.value.ok ? "Failed to fetch games" : "Failed to fetch votes",
        );
        return; // Continue to the next iteration
      }

      const basicStatsJson = (await games.value.json()) as {
        data: BasicStats[];
      };

      const votesJson = (await votes.value.json()) as { data: Vote[] };

      basicStatsJson.data.map((stats: BasicStats) => {
        const project = chunk.find(
          (project: Project) => project.universeId === stats.id.toString(),
        )!;

        if (!project) {
          return;
        }

        const votes = votesJson.data.find(
          (vote: Vote): boolean => parseInt(project.universeId) === vote.id,
        );

        const serverCount = activeServers.find(
          (_, index: number) => index === chunk.indexOf(project),
        );

        const newStats = {
          id: nid(),
          projectId: project.id,
          timestamp: new Date(),
          playerCount: stats.playing,
          visits: stats.visits.toString(),
          favourites: stats.favoritedCount,
          likes: votes?.upVotes ?? 0,
          dislikes: votes?.downVotes ?? 0,
          serverCount: serverCount ?? 0,
          averageServerFps: 0,
          averageServerPing: 0,
          averageServerPlayers: 0,
        } as Analytic;

        createQueue.add(newStats);
      });
    }),
  );

  const newAnalytics = await prisma.analytic.createMany({
    data: Array.from(createQueue),
    skipDuplicates: true,
  });

  consola.info(`Created ${newAnalytics.count} new analytics`);
})
