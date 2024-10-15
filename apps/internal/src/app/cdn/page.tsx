import { ListObjectsCommand, S3 } from "@/utils/s3";
import { File } from "./_components/file";
import { Upload } from "./_components/upload";

export default async function CDNUpload() {
  const listObjects = new ListObjectsCommand({
    Bucket: "cdn",
  });

  const result = await S3.send(listObjects);

  const files = (result.Contents ?? []).filter((file) =>
    file.Key?.startsWith("files/"),
  );

  return (
    <main className="">
      <Upload />

      <ul className="mt-6">
        {files.map((file) => (
          <File file={file} key={file.Key} />
        ))}
      </ul>
    </main>
  );
}
