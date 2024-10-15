import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ChannelType } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { Ticket } from "src/lib/drizzle/schema";
import { getActiveTicket, sendUpdate } from "src/lib/ticket";

@ApplyOptions<Command.Options>({
  description: "Claim a ticket",
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

    if (ticket.assignedTo) {
      return interaction.reply({
        content: `This ticket is already assigned to <@${ticket.assignedTo}>`,
        ephemeral: true,
      });
    }

    const [ticketRecord] = await db
      .update(Ticket)
      .set({ assignedTo: interaction.user.id })
      .where(eq(Ticket.id, ticket.id))
      .returning();

    await sendUpdate("assignee", ticketRecord!);

    return interaction.reply({ content: "Ticket claimed.", ephemeral: true });
  }
}
