import { type NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { S3 } from "@/utils/s3";

export const POST = async (request: NextRequest) => {
  if (!request.headers.get("Content-Type")?.startsWith("multipart/form-data")) {
    return new Response("Not a multipart/form-data request", { status: 400 });
  }

  if (
    request.headers.get("Authorization") !==
    `Bearer ${process.env.SDK_ARTIFACT_UPLOAD_SECRET}`
  ) {
    return new Response("Invalid secret", { status: 401 });
  }

  const body = await request.formData();

  const file = body.get("file") as File;
  const commitHash = body.get("commitHash") as string;

  const command = new PutObjectCommand({
    Bucket: "cdn",
    Key: `sdk/artifacts/${commitHash}/Metrik.rbxm`,
    Body: new Uint8Array(await file.arrayBuffer()),
    ContentType: file.type,
  });

  const response = await S3.send(command);

  if (response.$metadata.httpStatusCode !== 200) {
    return new Response("Failed to upload file", { status: 500 });
  }

  return new Response(
    JSON.stringify({
      url: `https://cdn.metrik.app/sdk/artifacts/${commitHash}/Metrik.rbxm`,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
