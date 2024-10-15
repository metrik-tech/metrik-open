import { container } from "@sapphire/framework";
import { capitalizeFirstLetter } from "@sapphire/utilities";
import {
  ChannelType,
  EmbedBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { Ticket, type category } from "src/lib/drizzle/schema";

import {
  CHANNEL_NAME_SEPARATOR,
  EMBED_COLOR,
  LEVEL_EMOJIS,
  TICKETS_CATEGORY_ID,
} from "./constants";

export async function getActiveTicket(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
) {
  if (interaction.channel?.type !== ChannelType.GuildText) {
    return;
  }
  if (interaction.channel.parentId !== TICKETS_CATEGORY_ID) {
    await interaction.reply({
      content: "No active ticket found in this channel.",
      ephemeral: true,
    });
    return;
  }

  const [ticket] = await db
    .select()
    .from(Ticket)
    .where(eq(Ticket.channelId, interaction.channelId))
    .limit(1);

  if (!ticket) {
    await interaction.reply({
      content: "No ticket found in this channel.",
      ephemeral: true,
    });
    return;
  }

  return ticket;
}

type Category = (typeof category.enumValues)[number];

type TicketLevelEmojis = (typeof LEVEL_EMOJIS)[keyof typeof LEVEL_EMOJIS];
type ChannelName =
  `${TicketLevelEmojis}${typeof CHANNEL_NAME_SEPARATOR}${Lowercase<Category>}${typeof CHANNEL_NAME_SEPARATOR}${string}`;

function sortByEmojiLevel(
  a: keyof typeof LEVEL_EMOJIS,
  b: keyof typeof LEVEL_EMOJIS,
) {
  const levels = {
    [LEVEL_EMOJIS.STALE]: 4,
    [LEVEL_EMOJIS.NEW]: 3,
    [LEVEL_EMOJIS.LOW]: 2,
    [LEVEL_EMOJIS.MEDIUM]: 1,
    [LEVEL_EMOJIS.HIGH]: 0,
  } as Record<TicketLevelEmojis, number>;

  return levels[LEVEL_EMOJIS[a]] - levels[LEVEL_EMOJIS[b]];
}

export async function sortTickets(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  ignore?: typeof Ticket.$inferSelect,
) {
  const channels = interaction.guild?.channels.cache.filter(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.id !== ignore?.channelId &&
      channel.parentId === TICKETS_CATEGORY_ID,
  );

  if (!channels) return;

  const sorted = sortFunction(
    channels.map((channel) => channel.name as ChannelName),
  );

  await Promise.all(
    channels.map(async (channel) => {
      if (channel.type !== ChannelType.GuildText) return;

      await channel.setPosition(sorted.indexOf(channel.name as ChannelName));
    }),
  );

  return;
}

export async function setTicketLevelInChannelName(
  status: keyof typeof LEVEL_EMOJIS,
  ticket: typeof Ticket.$inferSelect,
) {
  const channel = await container.client.channels.fetch(ticket.channelId);

  if (!channel) return;
  if (channel.type !== ChannelType.GuildText) return;

  const channelName = channel.name as ChannelName;

  const [_, category, ticketId] = channelName.split(CHANNEL_NAME_SEPARATOR);

  const newChannelName = `${LEVEL_EMOJIS[status]}${CHANNEL_NAME_SEPARATOR}${category}${CHANNEL_NAME_SEPARATOR}${ticketId}`;

  await channel.setName(newChannelName);

  return;
}

type Update = "level" | "team" | "assignee" | "triage";

export async function sendUpdate(
  update: Update,
  ticket: typeof Ticket.$inferSelect,
) {
  const channel = await container.client.channels.fetch(ticket.channelId);

  if (!channel) return;
  if (channel.type !== ChannelType.GuildText) return;

  switch (update) {
    case "level": {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("Level updated")
        .setDescription(
          `The ticket level was updated to **${LEVEL_EMOJIS[ticket.level]} ${capitalizeFirstLetter(ticket.level.toLowerCase())}**`,
        );

      await channel.send({
        embeds: [embed],
      });
      break;
    }
    case "team": {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("Team updated")
        .setDescription(
          `The team assigned to the ticket was updated to **${capitalizeFirstLetter(
            ticket.team.toLowerCase(),
          )}**`,
        );

      await channel.send({
        embeds: [embed],
      });
      break;
    }
    case "assignee": {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("Assignee updated")
        .setDescription(
          `The ticket was assigned to **<@${ticket.assignedTo}>**`,
        );

      await channel.send({
        embeds: [embed],
      });

      break;
    }
    case "triage": {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("Ticket Triaged")
        .setDescription(`The ticket has been triaged`)
        .addFields(
          {
            name: "Team",
            value: `${capitalizeFirstLetter(ticket.team.toLowerCase())}`,
          },
          {
            name: "Level",
            value: `${LEVEL_EMOJIS[ticket.level]} ${capitalizeFirstLetter(ticket.level.toLowerCase())}`,
          },
          {
            name: "Assignee",
            value: ticket.assignedTo ? `<@${ticket.assignedTo}>` : "Nobody yet",
          },
        );

      await channel.send({
        embeds: [embed],
      });

      break;
    }
  }

  return;
}

export function sortFunction(tickets: ChannelName[]) {
  return Object.entries(
    tickets.reduce(
      (acc, ticket) => {
        const [_, rest] = ticket.split(CHANNEL_NAME_SEPARATOR) as [
          TicketLevelEmojis,
          Lowercase<Category>,
        ];

        if (!acc[rest]) acc[rest] = [];
        acc[rest].push(ticket);
        return acc;
      },
      {} as Record<Lowercase<Category>, ChannelName[]>,
    ),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, value]) => [
      ...value.sort((a, b) =>
        sortByEmojiLevel(
          a.split(CHANNEL_NAME_SEPARATOR)[1] as keyof typeof LEVEL_EMOJIS,
          b.split(CHANNEL_NAME_SEPARATOR)[1] as keyof typeof LEVEL_EMOJIS,
        ),
      ),
    ])
    .flat();
}
