import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { format } from "date-fns";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { EMBED_COLOR } from "src/lib/constants";
import { getLinkedUser } from "src/lib/metrik";
import { getActiveTicket } from "src/lib/ticket";

@ApplyOptions<Command.Options>({
  description: "See the user's linked Metrik account",
  preconditions: ["StaffOnly"],
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

    const user = await getLinkedUser(ticket.userId);

    if (!user) {
      return interaction.reply({
        content: "No Metrik link found for this user.",
        ephemeral: true,
      });
    }

    const button = new ButtonBuilder()
      .setLabel("Open on Internal Dashboard")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://internal.metrik.app/users/${user.id}`);

    const robloxButton = new ButtonBuilder()
      .setLabel("Open user on Roblox")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://www.roblox.com/users/${user.robloxId}/profile`);

    const actionRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        button,
        robloxButton,
      );

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLOR)
          .setTitle(`:white_check_mark: Metrik account \`${user.name}\` linked`)
          .setImage(`https://thumbs.metrik.app/user/${user.robloxId}`)
          .addFields([
            {
              name: "Username",
              value: `${user.name}`,
            },
            {
              name: "Roblox ID",
              value: `\`${user.robloxId}\``,
            },
            {
              name: "Created at",
              value: format(user.createdAt, "d MMM yyyy HH:mm"),
            },
            {
              name: "Onboarded",
              value: user.onboarded ? "Yes" : "No",
            },
            {
              name: "Studio trial used",
              value: user.studioTrialUsed ? "Yes" : "No",
            },
            {
              name: "Last login",
              value: user.lastLogin
                ? format(user.lastLogin, "d MMM yyyy HH:mm")
                : "Never",
            },
          ]),
      ],
      components: [actionRow],
      ephemeral: true,
    });
  }
}
