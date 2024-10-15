import { fetchHandler } from "@/server/api/handler";
import { membershipRouter } from "@/server/api/routers/membership";

const handler = fetchHandler(membershipRouter, "membership");

export { handler as GET, handler as POST };
