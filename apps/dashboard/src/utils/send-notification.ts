import { format, getTime } from "date-fns";

import type {
  ChannelEvents,
  NotificationChannel,
  Project,
} from "@metrik/db/client";
import { prisma } from "@metrik/db/edge";

import config, { ValidServices } from "./config";

interface Details {
  error?: string;
  timestamp: Date | number;
}

interface SendNotification {
  type: ChannelEvents;
  details: Details;
  projectId: string;
}

export async function sendNotification({
  type,
  details,
  projectId,
}: SendNotification) {
  const [project, channels] = await prisma.$transaction([
    prisma.project.findFirst({
      where: {
        id: projectId,
      },
      include: {
        studio: true,
        notificationChannels: true,
      },
    }),
    prisma.notificationChannel.findMany({
      where: {
        projectId,
        events: {},
      },
    }),
  ]);

  if (!channels || !project) {
    return;
  }

  switch (type) {
    // case "USAGE":
    //   return await sendUsageNotification({ details, channels, project });
    case "ERRORS":
      return await sendErrorNotification({
        details: details as SendErrorNotificationDetails,
        channels,
        project,
      });
    // case "REVENUE":
    //   return await sendRevenueNotification({ details, channels, project });
    default:
      return;
  }
}

interface SendErrorNotificationDetails {
  error: string;
  timestamp: Date | number;
}

interface SendErrorNotification {
  details: SendErrorNotificationDetails;
  channels: NotificationChannel[];
  project: Project;
}

async function sendErrorNotification({
  details,
  channels,
  project,
}: SendErrorNotification) {
  const { error, timestamp } = details;

  const time = getTime(timestamp);

  const message = `\`\`\`\n${error}\n\`\`\``;

  for (const channel of channels) {
    await sendMessage({
      title: "Error",
      message,
      hookUrl: channel.webhookUrl,
      project,
      type: channel.type as ValidServices,
      additionalFields: [
        {
          name: "Timestamp",
          value:
            channel.type === "DISCORD"
              ? `<t:${Math.floor(time / 1000)}:F>`
              : format(timestamp, "EEEE, LLLL d, yyyy h:mm a"),
        },
      ],
    });
  }
}

// async function sendRevenueNotification({ details, channels, project }) {
//   const { revenue, timestamp, assetName, assetId } = details;

//   const message = `**$${assetName}** sold for **${revenue}**`;
//   const additionalFields = [
//     {
//       name: "Timestamp",
//       value:
//         channel.type === "DISCORD"
//           ? `<t:${Math.floor(timestamp / 1000)}:F>`
//           : format(timestamp, "EEEE, LLLL d, yyyy h:mm a"),
//     },
//     {
//       name: "Asset",
//       value: `https://roblox.com`,
//     },
//   ];
// }

// async function sendUsageNotification({ details, channels, project }) {
//   const { used, remaining, total, resource } = details;

//   const message = `**${project.name}** has used ${
//     (used / remaining) * 100
//   }% of log storage!`;

//   for (const channel of channels) {
//     await sendMessage({
//       title: "Usage Alert",
//       message,
//       hookUrl: channel.webhookUrl,
//       project,
//     });
//   }
// }

interface AdditionalFields {
  name: string;
  value: string;
}

interface SendMessage {
  title: string;
  message: string;
  hookUrl: string;
  type: ValidServices;
  project: Project;
  additionalFields?: AdditionalFields[];
}

async function sendMessage({
  title,
  message,
  hookUrl,
  type,
  project,
  additionalFields,
}: SendMessage) {
  switch (type) {
    case ValidServices.Discord:
      return await baseDiscordNotification({
        title,
        message,
        hookUrl,
        project,
        additionalFields,
      });
    case ValidServices.Slack:
      return await baseSlackNotification({ title, message, hookUrl, project });
    case ValidServices.Guilded:
      return await baseDiscordNotification(
        {
          title,
          message,
          hookUrl,
          project,
          additionalFields,
        },
        ValidServices.Guilded,
      );
    default:
      return;
  }
}

interface SendBaseMessage {
  title: string;
  message: string;
  hookUrl: string;
  project: Project;
  additionalFields?: AdditionalFields[];
}

export async function baseDiscordNotification(
  { title, message, hookUrl, project, additionalFields }: SendBaseMessage,
  type: ValidServices = ValidServices.Discord,
) {
  const embed = {
    content: null,
    embeds: [
      {
        title: title || "Alert",
        description: message || "No message provided",
        color: 1406701,
        author: {
          name: project.name,
          url: `${config.determineUrl()}/projects/${project.id}/analytics`,
        },
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

  const url =
    type === ValidServices.Discord
      ? await getCorrectDiscordUrl(hookUrl)
      : hookUrl;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(embed),
  });

  if (response.ok) {
    return;
  } else {
    throw new Error(`Failed to send ${type} notification`);
  }
}

export async function baseSlackNotification({
  title,
  message,
  hookUrl,
  project,
}: SendBaseMessage) {
  const embed = {
    blocks: [
      {
        type: "context",
        elements: [
          {
            type: "plain_text",
            text: project.name,
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title || "Alert",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message || "No message provided",
        },
      },
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Metrik | ${format(new Date(), "EEEE, LLLL d, yyyy h:mm a")}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(hookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(embed),
  });

  if (response.ok) {
    return;
  } else {
    throw new Error(`Failed to send Slack notification`);
  }
}

export async function getCorrectDiscordUrl(url: string) {
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
