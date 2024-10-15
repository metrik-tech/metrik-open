import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ChannelType } from "discord.js";
import { and, eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { Message, Ticket } from "src/lib/drizzle/schema";
import { S3 } from "src/lib/s3";
import { getActiveTicket } from "src/lib/ticket";

import {
  CLOSED_TICKETS_CATEGORY_ID,
  TICKETS_CATEGORY_ID,
} from "../lib/constants";

@ApplyOptions<Command.Options>({
  description: "Delete current closed ticket",
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
            .setName("keep_record")
            .setDescription("Keep the record of the ticket in the database")
            .setRequired(false),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    if (interaction.channel.parentId !== CLOSED_TICKETS_CATEGORY_ID)
      return interaction.reply({
        content: "Only already closed tickets can be deleted.",
        ephemeral: true,
      });

    const keepRecord = interaction.options.getBoolean("keepRecord") ?? false;

    const [ticket] = await db
      .select()
      .from(Ticket)
      .where(
        and(
          eq(Ticket.channelId, interaction.channelId),
          eq(Ticket.closed, true),
        ),
      );

    if (!ticket) {
      return interaction.reply({
        content: "No ticket found in this channel.",
        ephemeral: true,
      });
    }

    const transcript = await db
      .select()
      .from(Message)
      .where(eq(Message.ticketId, ticket.id));

    if (!keepRecord) {
      const attachments = transcript
        .map((message) => message.attachments)
        .flat();

      if (attachments.length) {
        const command = new DeleteObjectsCommand({
          Bucket: "ticket-attachments",
          Delete: {
            Objects: attachments.map((message) => ({
              Key: message!.split("https://ta.metrik.app/")[1],
            })),
            Quiet: true,
          },
        });

        const response = await S3.send(command);

        if (response.$metadata.httpStatusCode !== 200) {
          return interaction.reply({
            content: "Failed to delete attachments.",
            ephemeral: true,
          });
        }
      }

      await db.delete(Ticket).where(eq(Ticket.id, ticket.id));
    } else {
      await db
        .update(Ticket)
        .set({ deleted: true })
        .where(eq(Ticket.id, ticket.id));
    }

    await interaction.channel.delete(
      `Deleted by ${interaction.user.displayName}`,
    );

    return;
  }
}
