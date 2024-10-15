import { fetchHandler } from "@/server/api/handler";
import { commandsRouter } from "@/server/api/routers/commands";

const handler = fetchHandler(commandsRouter, "commands");

export { handler as GET, handler as POST };
