import { GetObjectCommand, ListObjectsV2Command, S3 } from "@/utils/s3";

export async function GET() {
  const listCommand = new ListObjectsV2Command({
    Bucket: "cdn",
    Prefix: "sdk/artifacts",
  });

  const response = await S3.send(listCommand);

  if (!response.Contents) {
    return new Response("No artifacts found", { status: 404 });
  }

  const latestArtifact = response.Contents.reduce((a, b) => {
    if (a.LastModified!.getTime() > b.LastModified!.getTime()) {
      return a;
    }

    return b;
  });

  const artifact = await fetch(`https://cdn.metrik.app/${latestArtifact.Key}`);

  return new Response(artifact.body, {
    ...artifact,
    headers: {
      ...artifact.headers,
      "Content-Disposition": `attachment; filename="Metrik.rbxm"`,
    },
  });
}
