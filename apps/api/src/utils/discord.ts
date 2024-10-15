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
  color,
}: {
  message: string;
  data?: { name: string; value: unknown }[] | undefined;
  color: "blue" | "yellow" | "red" | "green" | "purple";
}) {
  const colorMap = {
    blue: 1406701,
    yellow: 16436245,
    red: 15680580,
    green: 2278750,
    purple: 11032055,
  };
  // copilot log to discord
  const hookUrl = await getCorrectDiscordUrl(
    process.env.DISCORD_LOG_WEBHOOK_URL!,
  );

  const additionalFields = [
    ...(data ?? []),
    {
      name: "Environment",
      value: `\`${process.env.COOLIFY_BRANCH}\``,
    },
  ];

  const embed = {
    content: null,
    embeds: [
      {
        title: message,
        description: "New event from Metrik",
        color: colorMap[color],

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
