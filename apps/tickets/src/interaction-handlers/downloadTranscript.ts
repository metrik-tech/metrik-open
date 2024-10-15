import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import { AttachmentBuilder, type ButtonInteraction } from "discord.js";
import { and, eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { Message, Ticket } from "src/lib/drizzle/schema";
import { getActiveTicket } from "src/lib/ticket";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
  public async run(interaction: ButtonInteraction) {
    const [ticket] = await db
      .select()
      .from(Ticket)
      .where(
        and(
          eq(Ticket.channelId, interaction.channelId),
          eq(Ticket.closed, true),
        ),
      );

    if (!ticket) return;

    const transcript = await db
      .select()
      .from(Message)
      .where(eq(Message.ticketId, ticket.id));

    if (!ticket) {
      return await interaction.reply("No ticket found in this channel.");
    }

    const attachment = new AttachmentBuilder(
      Buffer.from(JSON.stringify(transcript)),
      {
        name: `transcript-${ticket.id}.json`,
      },
    );

    return await interaction.reply({
      content: "One-time transcript download.",
      // Let's make it so only the person who pressed the button can see this message!
      files: [attachment],
      ephemeral: true,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== "download-transcript") return this.none();

    return this.some();
  }
}
