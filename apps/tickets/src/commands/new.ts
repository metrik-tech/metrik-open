import { ApplyOptions } from "@sapphire/decorators";
import { Command, type ChatInputCommand } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ApplicationCommandType,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  OverwriteType,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type Message,
} from "discord.js";

@ApplyOptions<ChatInputCommand.Options>({
  description: "Create a new ticket",
})
export class UserCommand extends Command {
  // Register Chat Input and Context Menu command
  public override registerApplicationCommands(_registry: Command.Registry) {
    // Register Chat Input command
    // registry.registerChatInputCommand((builder) =>
    //   builder.setName(this.name).setDescription(this.description),
    // );
  }

  // Message command
  //   public override async messageRun(message: Message) {
  //     return this.createTicket(message);
  //   }

  // Chat Input (slash) command
  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    return this.createTicket(interaction);
  }

  private async createTicket(
    interactionOrMessage: Command.ChatInputCommandInteraction,
  ) {
    const modal = new ModalBuilder()
      .setTitle("Create a new ticket")
      .setCustomId("create-ticket");

    const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("How can we help?")
      .setPlaceholder("Please be as descriptive as possible")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      input,
    );

    modal.addComponents(actionRow);

    await interactionOrMessage.showModal(modal);
  }
}
