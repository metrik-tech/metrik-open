import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

import { prisma } from "@metrik/db";

import { auth } from "./auth";

const uploadthing = createUploadthing({
  errorFormatter: (err) => {
    console.log("upload error", err);
    console.log("upload error cause", err.cause);
    return {
      message: err.message,
    };
  },
});

export const fileRouter = {
  studioAvatarUpload: uploadthing({ image: { maxFileSize: "2MB" } })
    .input(
      z.object({
        studioId: z.string(),
      }),
    )
    .middleware(async ({ input, req }) => {
      const session = await auth();

      if (!session?.user) throw new Error("Unauthorized");

      const studio = await prisma.studio.findFirst({
        where: {
          id: input.studioId,
        },

        include: {
          membership: {
            select: {
              role: true,
              userId: true,
            },
          },
        },
      });

      if (
        !studio ||
        !studio.membership.find((member) => member.userId === session.user.id)
      ) {
        throw new Error("Studio not found");
      }

      if (
        studio.membership.find((member) => member.userId === session.user.id)
          ?.role !== "OWNER"
      ) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
        studioId: input.studioId,
        originalAvatarUrl: studio.avatarUrl,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.studio.update({
        where: {
          id: metadata.studioId,
        },
        data: {
          avatarUrl: file.url,
        },
      });

      if (metadata.originalAvatarUrl) {
        const utapi = new UTApi();

        const fileKey = metadata.originalAvatarUrl.replace(
          "https://utfs.io/f/",
          "",
        );

        await utapi.deleteFiles(fileKey);
      }

      return { success: true };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
