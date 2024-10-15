"use server";

import { cookies } from "next/headers";
import { decode } from "@tsndr/cloudflare-worker-jwt";
import { v4 as uuid } from "uuid";
import { string, z } from "zod";
import { zfd } from "zod-form-data";

import { action } from "@/utils/action";
import { isAuthorizedForAdmin } from "@/utils/authorization";
import { DeleteObjectCommand, PutObjectCommand, S3 } from "@/utils/s3";

export const uploadFile = action(
  zfd.formData({
    file: zfd.file(),
    keepFilename: zfd.checkbox(),
  }),
  async ({ file, keepFilename }) => {
    const key = keepFilename
      ? file.name
      : `${uuid()}.${file.name.split(".").pop()}`;

    const command = new PutObjectCommand({
      Bucket: "cdn",
      Key: `files/${key}`,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
    });

    const response = await S3.send(command);

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to upload file");
    }

    return {
      url: `https://cdn.metrik.app/files/${key}`,
    };
  },
);

export const deleteFile = action(
  z.object({
    key: z.string(),
  }),

  async ({ key }) => {
    const store = cookies();
    const jwt = store.get("CF_Authorization")?.value;

    if (!jwt) {
      return;
    }

    const decoded = decode<{ email: string }>(jwt);

    if (!decoded.payload) {
      return;
    }

    if (!isAuthorizedForAdmin(decoded.payload.email)) {
      return;
    }

    if (!key.startsWith("files/")) {
      throw new Error("Invalid key");
    }

    const command = new DeleteObjectCommand({
      Bucket: "cdn",
      Key: key,
    });

    const response = await S3.send(command);

    if (response.$metadata.httpStatusCode !== 204) {
      throw new Error("Failed to delete file");
    }

    return;
  },
);
