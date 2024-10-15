import { NextRequest, NextResponse } from "next/server";

import { prisma as httpPrisma } from "@metrik/db";
import { PrismaClient } from "@metrik/db/client";

const tcpPrisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
  const [tcp, http] = await Promise.all([
    (async function tcp() {
      const t1 = performance.now();
      await tcpPrisma.project.findFirst({
        where: {
          studio: {
            membership: {
              some: {
                user: {
                  name: "cursecode",
                },
              },
            },
          },
        },
        include: {
          studio: true,
          analytics: true,
        },
      });
      const t2 = performance.now();
      return t2 - t1;
    })(),
    (async function http() {
      const t1 = performance.now();
      await httpPrisma.project.findFirst({
        where: {
          studio: {
            membership: {
              some: {
                user: {
                  name: "cursecode",
                },
              },
            },
          },
        },
        include: {
          studio: true,
          analytics: true,
        },
      });
      const t2 = performance.now();
      return t2 - t1;
    })(),
  ]);

  return new Response(
    JSON.stringify({
      latencies: {
        tcp: `${tcp.toFixed(0)}ms`,
        http: `${http.toFixed(0)}ms`,
      },
      region: process.env.VERCEL_REGION,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    },
  );
}
