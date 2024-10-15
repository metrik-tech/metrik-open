import { fetchHandler } from "@/server/api/handler";
import { invitesRouter } from "@/server/api/routers/invites";

const handler = fetchHandler(invitesRouter, "invites");

export { handler as GET, handler as POST };
