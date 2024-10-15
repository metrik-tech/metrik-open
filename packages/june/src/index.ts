import { Analytics } from "@june-so/analytics-node";

export const june = new Analytics(process.env.JUNE_WRITE_KEY!, {
  flushAt: 1,
});
