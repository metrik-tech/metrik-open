"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";

import { uploadFile } from "../action";

export function Upload() {
  const router = useRouter();
  const { execute, result } = useAction(uploadFile, {
    onSettled: () => {
      router.refresh();
    },
  });
  return (
    <>
      <h1 className="mb-4 mt-2">Upload a file to the CDN</h1>
      <form
        className="block"
        onSubmit={(e) => {
          e.preventDefault();

          const formData = new FormData(e.target as HTMLFormElement);

          execute(formData);
        }}
      >
        <div>
          <input type="file" name="file" />
        </div>
        <div>
          <label htmlFor="keepFilename">Keep filename</label>
          <input type="checkbox" name="keepFilename" />
        </div>

        <button
          type="submit"
          className="mt-2 bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          Upload
        </button>
      </form>
      {result.data && <p>Uploaded to {result.data.url}</p>}
    </>
  );
}
