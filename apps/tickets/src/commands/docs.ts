import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { EMBED_COLOR } from "src/lib/constants";

@ApplyOptions<Subcommand.Options>({
  description: "Commands related to the Metrik docs",
  subcommands: [
    {
      name: "search",
      chatInputRun: "search",
    },
  ],
})
export class UserCommand extends Subcommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((command) =>
          command
            .setName("search")
            .setDescription("Search the Metrik docs")
            .addStringOption((option) =>
              option
                .setName("query")
                .setDescription("Search for anything...")
                .setRequired(true)
                .setAutocomplete(true),
            ),
        ),
    );
  }

  public async search(interaction: Subcommand.ChatInputCommandInteraction) {
    const link = interaction.options.getString("query");

    if (!link) {
      return interaction.reply({
        content: "You need to provide a link to search for",
        ephemeral: true,
      });
    }

    const pageContent = await fetch(`https://r.jina.ai/${link}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!pageContent.ok) {
      return interaction.reply({
        content: `Our Page renderer is currently down. You can read the docs article here: ${link}`,
        ephemeral: true,
      });
    }

    const page = (await pageContent.json()) as {
      data: {
        title: string;
        content: string;
      };
    };

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(page.data.title)
      .setDescription(page.data.content);
    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(link)
      .setLabel("Open in browser");

    const actionRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        button,
      );

    return await interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });
  }
}
