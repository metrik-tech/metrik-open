import { actionsRouter } from "./routers/actions";
import { auroraRouter } from "./routers/aurora";
import { billingRouter } from "./routers/billing";
import { broadcastsRouter } from "./routers/broadcasts";
import { channelsRouter } from "./routers/channels";
import { commandsRouter } from "./routers/commands";
import { invitesRouter } from "./routers/invites";
import { membershipRouter } from "./routers/membership";
import { onboardingRouter } from "./routers/onboarding";
import { projectsRouter } from "./routers/projects";
import { serversRouter } from "./routers/servers";
import { sessionRouter } from "./routers/session";
import { studiosRouter } from "./routers/studios";
import { tokensRouter } from "./routers/tokens";
import { usersRouter } from "./routers/users";
import { createTRPCRouter } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  studios: studiosRouter,
  channels: channelsRouter,
  broadcasts: broadcastsRouter,
  onboarding: onboardingRouter,
  invites: invitesRouter,
  billing: billingRouter,
  users: usersRouter,
  membership: membershipRouter,
  tokens: tokensRouter,
  session: sessionRouter,
  aurora: auroraRouter,
  actions: actionsRouter,
  commands: commandsRouter,
  servers: serversRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
