import { fetchHandler } from "@/server/api/handler";
import { tokensRouter } from "@/server/api/routers/tokens";

const handler = fetchHandler(tokensRouter, "tokens");

export { handler as GET, handler as POST };
