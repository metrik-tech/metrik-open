import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { DurationFormatter } from "@sapphire/time-utilities";
import { formatDuration } from "date-fns";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  type APIMessageActionRowComponent,
  type MessageActionRowComponentBuilder,
  type MessageComponentBuilder,
} from "discord.js";
import { eq } from "drizzle-orm";
import {
  CHANNEL_NAME_SEPARATOR,
  CLOSED_TICKETS_CATEGORY_ID,
  EMBED_COLOR,
  METRIK_TEAM_ROLE_ID,
  PARSE_USERNAME,
  TICKETS_CATEGORY_ID,
} from "src/lib/constants";
import { db } from "src/lib/drizzle/db";
import { Ticket } from "src/lib/drizzle/schema";
import { TimEmbedBuilder } from "src/lib/embed";
import { getActiveTicket, sortTickets } from "src/lib/ticket";

@ApplyOptions<Command.Options>({
  description: "Close the ticket in the current channel",
  preconditions: ["StaffOnly"],
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addBooleanOption((option) =>
          option
            .setName("solved")
            .setDescription("Was the issue solved?")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("notes")
            .setDescription("Closing notes or context for the ticket")
            .setRequired(false),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    console.log(ticket);

    if (!ticket) return;

    const notes = interaction.options.getString("notes");
    const solved = interaction.options.getBoolean("solved") ?? false;

    const [ticketRecord] = await db
      .update(Ticket)
      .set({
        closedAt: interaction.createdAt,
        closedBy: interaction.user.id,
        closingNotes: notes,
        solved,
        closed: true,
      })
      .where(eq(Ticket.id, ticket.id))
      .returning();

    if (!ticketRecord) return;

    const button = new ButtonBuilder()
      .setLabel("Download transcript")
      .setCustomId("download-transcript")
      .setStyle(ButtonStyle.Secondary);

    const actionRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        button,
      );

    const user = await interaction.guild?.members.fetch(ticketRecord.userId);

    await Promise.all([
      interaction.channel.setName(
        `${ticket.category}${CHANNEL_NAME_SEPARATOR}${PARSE_USERNAME(user!.user.username)}`,
      ),
      interaction.channel.send({
        components: [actionRow],
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("Ticket closed")
            .addFields(
              {
                name: "Solved",
                value: `${ticketRecord.solved ? "Yes" : "No"}`,
              },
              {
                name: "Resolved at",
                value: `<t:${Math.floor(ticketRecord.closedAt!.getTime() / 1000)}:f>`,
              },
              {
                name: "Resolved by",
                value: `<@${ticketRecord.closedBy}>`,
              },
              {
                name: "Ticket duration",
                value: new DurationFormatter().format(
                  new Date(ticketRecord.closedAt!).getTime() -
                    new Date(ticketRecord.createdAt).getTime(),
                ),
              },
              {
                name: "Category",
                value: `\`${ticketRecord.category}\``,
              },
              {
                name: "Closing notes",
                value: ticketRecord.closingNotes ?? "No notes.",
              },
            ),
        ],
      }),
      interaction.channel.permissionOverwrites.edit(interaction.user, {
        ViewChannel: false,
        SendMessages: false,
      }),
    ]);

    await interaction.channel.setParent(CLOSED_TICKETS_CATEGORY_ID);
    await sortTickets(interaction, ticket);

    return interaction.reply({
      content: "Ticket closed.",
      ephemeral: true,
    });
  }
}
