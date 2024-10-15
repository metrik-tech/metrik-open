import { generateReactHelpers } from "@uploadthing/react/hooks";

import type { AppFileRouter } from "@/server/upload";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<AppFileRouter>({
    url: "/api/upload",
  });
