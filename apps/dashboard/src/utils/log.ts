import { env } from "@/env.mjs";

async function getCorrectDiscordUrl(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch correct webhook url");
  }

  interface Webhook {
    id: string;
    token: string;
  }

  const webhook = (await response.json()) as Webhook;

  return `https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`;
}

export async function log({
  message,
  data,
}: {
  message: string;
  data?: { name: string; value: unknown }[] | undefined;
}) {
  // copilot log to discord
  const hookUrl = await getCorrectDiscordUrl(env.DISCORD_LOG_WEBHOOK_URL!);

  const additionalFields = [
    ...(data ?? []),
    {
      name: "Environment",
      value: `\`${env.VERCEL_ENV ? env.VERCEL_ENV : "development"}\``,
    },
  ];

  const embed = {
    content: null,
    embeds: [
      {
        title: message,
        description: "New event from Metrik",
        color: 1406701,

        fields: additionalFields ?? undefined,
        footer: {
          text: "Metrik",
          icon_url:
            "https://avatars.githubusercontent.com/u/78037522?s=200&v=4",
        },
        timestamp: new Date(),
      },
    ],
    attachments: [],
  };

  if (!hookUrl) {
    return;
  }

  const response = await fetch(hookUrl, {
    method: "POST",
    body: JSON.stringify(embed),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    return;
  } else {
    console.log(response.status);
    console.log(await response.text());
    throw new Error(`Failed to send Log event`);
  }
}
