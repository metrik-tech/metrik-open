import { fetchHandler } from "@/server/api/handler";
import { auroraRouter } from "@/server/api/routers/aurora";

const handler = fetchHandler(auroraRouter, "aurora");

export { handler as GET, handler as POST };
