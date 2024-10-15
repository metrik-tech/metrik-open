import { fetchHandler } from "@/server/api/handler";
import { serversRouter } from "@/server/api/routers/servers";

const handler = fetchHandler(serversRouter, "servers");

export { handler as GET, handler as POST };
