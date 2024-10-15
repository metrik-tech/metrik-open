import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { capitalizeFirstLetter } from "@sapphire/utilities";
import { ChannelType } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { team as teamEnum, Ticket } from "src/lib/drizzle/schema";
import {
  getActiveTicket,
  sendUpdate,
  setTicketLevelInChannelName,
  sortTickets,
} from "src/lib/ticket";

@ApplyOptions<Command.Options>({
  description: "Triage a ticket and set its level",
  preconditions: ["StaffOnly"],
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName("level")
            .setDescription("Level of the ticket")
            .setRequired(true)
            .addChoices(
              {
                name: "🟡 Low",
                value: "LOW",
              },
              {
                name: "🟠 Medium",
                value: "MEDIUM",
              },
              {
                name: "🔴 High",
                value: "HIGH",
              },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("team")
            .setDescription("Team to assign the ticket to")
            .setRequired(true)
            .addChoices(
              teamEnum.enumValues.map((team) => ({
                name: capitalizeFirstLetter(team.toLowerCase()),
                value: team,
              })),
            ),
        )
        .addBooleanOption((option) =>
          option
            .setName("keep_assignee")
            .setDescription("Keep current assignee")
            .setRequired(false),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    const level = interaction.options.getString("level") as
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | null;

    const team = interaction.options.getString("team") as
      | (typeof teamEnum.enumValues)[number]
      | null;

    const keepAssignee =
      interaction.options.getBoolean("keep_assignee") ?? false;

    const [[ticketRecord]] = await Promise.all([
      db
        .update(Ticket)
        .set({
          team: team ?? "SUPPORT",
          level: level ?? "LOW",
          assignedTo: keepAssignee ? undefined : null,
        })
        .where(eq(Ticket.id, ticket.id))
        .returning(),
      setTicketLevelInChannelName(level ?? "LOW", ticket),
    ]);

    await sendUpdate("triage", ticketRecord!);
    await sortTickets(interaction);

    return interaction.reply({ content: "Ticket triaged.", ephemeral: true });
  }
}
