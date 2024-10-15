import { fetchHandler } from "@/server/api/handler";
import { studiosRouter } from "@/server/api/routers/studios";

const handler = fetchHandler(studiosRouter, "studios");

export { handler as GET, handler as POST };
