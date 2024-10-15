import { fetchHandler } from "@/server/api/handler";
import { actionsRouter } from "@/server/api/routers/actions";

const handler = fetchHandler(actionsRouter, "actions");

export { handler as GET, handler as POST };
