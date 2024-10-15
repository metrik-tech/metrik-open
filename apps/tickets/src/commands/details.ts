import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { capitalizeFirstLetter } from "@sapphire/utilities";
import { ChannelType, EmbedBuilder } from "discord.js";
import { EMBED_COLOR, LEVEL_EMOJIS } from "src/lib/constants";
import { getActiveTicket } from "src/lib/ticket";

@ApplyOptions<Command.Options>({
  description: "Get all details about current ticket",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle("Ticket details")
      .addFields(
        {
          name: "Ticket #",
          value: `${ticket.id}`,
        },
        {
          name: "User",
          value: `<@${ticket.userId}>`,
        },
        {
          name: "Message",
          value: `${ticket.reason}`,
        },
        {
          name: "Category",
          value: `\`${ticket.category}\``,
        },
        {
          name: "Level",
          value: `${LEVEL_EMOJIS[ticket.level]} ${capitalizeFirstLetter(ticket.level.toLowerCase())}`,
        },
        {
          name: "Team",
          value: `${capitalizeFirstLetter(ticket.team.toLowerCase())}`,
        },
        {
          name: "Assignee",
          value: ticket.assignedTo ? `<@${ticket.assignedTo}>` : "Nobody yet",
        },
        {
          name: "Created at",
          value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:f>`,
        },
      );

    await interaction.reply({
      embeds: [embed],
    });
  }
}
