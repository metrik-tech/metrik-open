import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
} from "discord.js";
import { count, eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { Ticket } from "src/lib/drizzle/schema";

export const buttons = [
  "general-ticket",
  "account-ticket",
  "sdk-ticket",
  "billing-ticket",
  "security-ticket",
  "other-ticket",
];

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
  public async run(interaction: ButtonInteraction) {
    const [ticketCount] = await db
      .select({ count: count() })
      .from(Ticket)
      .where(eq(Ticket.userId, interaction.user.id));

    if (!ticketCount) return;

    if (ticketCount.count >= 3) {
      await interaction.reply({
        content:
          "You have reached the maximum number of tickets you can create.",
        ephemeral: true,
      });
      return;
    }

    console.log(interaction.customId);

    const modal = new ModalBuilder()
      .setTitle(
        `Create a new ${capitalize(interaction.customId.split("-")[0]!)} ticket`,
      )
      .setCustomId(`create-ticket-${interaction.customId.split("-")[0]}`);

    const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("How can we help?")
      .setPlaceholder(
        "Please be as descriptive as possible. Any attachments can be added once the ticket has been created.",
      )
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      input,
    );

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }

  public override parse(interaction: ButtonInteraction) {
    if (!buttons.includes(interaction.customId)) return this.none();

    return this.some();
  }
}
