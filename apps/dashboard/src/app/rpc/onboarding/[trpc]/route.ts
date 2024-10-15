import { fetchHandler } from "@/server/api/handler";
import { onboardingRouter } from "@/server/api/routers/onboarding";

const handler = fetchHandler(onboardingRouter, "onboarding");

export { handler as GET, handler as POST };
