import { fetchHandler } from "@/server/api/handler";
import { projectsRouter } from "@/server/api/routers/projects";

const handler = fetchHandler(projectsRouter, "projects");

export { handler as GET, handler as POST };
