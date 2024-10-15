import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ChannelType, EmbedBuilder } from "discord.js";
import { EMBED_COLOR, TICKETS_CATEGORY_ID } from "src/lib/constants";
import { getLinkedUser } from "src/lib/metrik";
import { getActiveTicket } from "src/lib/ticket";

import { type User } from "@metrik/db/client";

@ApplyOptions<Command.Options>({
  description:
    "Check for a link between your Discord account and a Metrik account",
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

    if (ticket.userId !== interaction.user.id) {
      return interaction.reply({
        content: "Not your ticket.",
        ephemeral: true,
      });
    }

    const user = await getLinkedUser(interaction.user.id);

    if (!user) {
      return interaction.reply({
        content: "No Metrik link found for this user.",
        ephemeral: true,
      });
    } else {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(
              `:white_check_mark: Metrik account \`${user.name}\` linked`,
            )
            .setDescription(
              `We have found the Metrik account ${user.name} linked to your Discord account. This is the account you will now be receiving support for. `,
            ),
        ],
      });
    }
  }
}
