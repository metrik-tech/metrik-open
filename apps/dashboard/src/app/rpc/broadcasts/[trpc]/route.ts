import { fetchHandler } from "@/server/api/handler";
import { broadcastsRouter } from "@/server/api/routers/broadcasts";

const handler = fetchHandler(broadcastsRouter, "broadcasts");

export { handler as GET, handler as POST };
