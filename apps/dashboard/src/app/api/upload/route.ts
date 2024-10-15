import { createNextRouteHandler } from "uploadthing/next";

import { fileRouter } from "@/server/upload";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV === "preview")
    return `https://preview.metrik.app`; // SSR should use vercel url
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: fileRouter,
  config: {
    callbackUrl: `${getBaseUrl()}/api/upload`,
  },
});
