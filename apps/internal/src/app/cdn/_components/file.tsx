"use client";

import { useRouter } from "next/navigation";
import { type _Object } from "@aws-sdk/client-s3";
import { useAction } from "next-safe-action/hooks";

import { deleteFile } from "../action";

export function File({ file }: { file: _Object }) {
  const router = useRouter();
  const { execute } = useAction(deleteFile, {
    onSettled: () => {
      router.refresh();
    },
  });

  if (!file.Key) {
    return null;
  }

  const imgs = file.Key.match(/files\/.*\.(jpg|jpeg|png|gif|webp|svg)/);

  return (
    <li className="space-x-4">
      <p className="font-mono">{file.Key}</p>
      {imgs && (
        <img
          src={`https://cdn.metrik.app/${file.Key}`}
          alt={file.Key}
          className="h-20"
        />
      )}
      <a
        href={`https://cdn.metrik.app/${file.Key}`}
        target="_blank"
        rel="noreferrer"
      >
        Open
      </a>
      <button
        onClick={() => {
          void navigator.clipboard.writeText(
            `https://cdn.metrik.app/${file.Key}`,
          );
        }}
      >
        Copy URL
      </button>
      <button
        onClick={() => {
          execute({ key: file.Key as string });
        }}
        className="text-red-500"
      >
        Delete
      </button>
    </li>
  );
}
