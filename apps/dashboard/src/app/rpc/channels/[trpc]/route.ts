import { fetchHandler } from "@/server/api/handler";
import { channelsRouter } from "@/server/api/routers/channels";

const handler = fetchHandler(channelsRouter, "channels");

export { handler as GET, handler as POST };
