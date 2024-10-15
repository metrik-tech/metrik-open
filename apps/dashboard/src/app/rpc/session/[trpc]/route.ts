import { fetchHandler } from "@/server/api/handler";
import { sessionRouter } from "@/server/api/routers/session";

const handler = fetchHandler(sessionRouter, "session");

export { handler as GET, handler as POST };
