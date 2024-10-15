import { fetchHandler } from "@/server/api/handler";
import { billingRouter } from "@/server/api/routers/billing";

const handler = fetchHandler(billingRouter, "billing");

export { handler as GET, handler as POST };
