import { NextResponse, type NextRequest } from "next/server";
import { Logger, withAxiomRouteHandler } from "next-axiom";

import { prisma } from "@metrik/db";

import { createOauthSession } from "@/server/api/routers/projects";
// import { createCaller, createTRPCContext } from "@/server/api/trpc";
import { auth } from "@/server/auth";

export const GET = auth(async (req) => {
  const logger = new Logger({ source: "projects/reauth" });

  // const caller = createCaller(
  //   await createTRPCContext({ req, session: req.auth }),
  // );

  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return new Response("Invalid projectId", { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      studio: {
        membership: {
          some: {
            role: "OWNER",
            userId: req.auth?.user.id,
          },
        },
      },
    },
    include: {
      studio: true,
    },
  });

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const { href } = await createOauthSession({
    input: {
      id: projectId,
      studioId: project.studio.id,
      name: project.name,
    },
    callback: `/projects/${project.id}/settings`,
    noCreate: true,
    session: req.auth!,
  });

  logger.info("Reauth", {
    user: req.auth?.user,
    project: {
      ...project,
      studio: undefined,
    },
    studio: project?.studio,
  });

  await logger.flush();

  return NextResponse.redirect(href);
});
