import { fetchHandler } from "@/server/api/handler";
import { usersRouter } from "@/server/api/routers/users";

const handler = fetchHandler(usersRouter, "users");

export { handler as GET, handler as POST };
