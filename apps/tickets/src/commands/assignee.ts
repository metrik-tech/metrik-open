import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ChannelType } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { Ticket } from "src/lib/drizzle/schema";
import { getActiveTicket, sendUpdate } from "src/lib/ticket";

@ApplyOptions<Subcommand.Options>({
  description: "Manage the assignee of a ticket",
  subcommands: [
    {
      name: "set",
      preconditions: ["StaffOnly"],
      chatInputRun: "set",
    },
    {
      name: "get",
      chatInputRun: "get",
    },
  ],
})
export class UserCommand extends Subcommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("set")
            .setDescription("Set the ticket assignee")
            .addUserOption((option) =>
              option
                .setName("assignee")
                .setDescription("Who to assign the ticket to")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("get").setDescription("Get the ticket assignee"),
        ),
    );
  }

  public async set(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    const assignee =
      interaction.options.getUser("assignee") ?? interaction.user;

    const [ticketRecord] = await db
      .update(Ticket)
      .set({
        assignedTo: assignee.id,
      })
      .where(eq(Ticket.id, ticket.id))

      .returning();

    await sendUpdate("assignee", ticketRecord!);

    return interaction.reply({
      content: `Ticket assigned to <@${assignee.id}>`,
      ephemeral: true,
    });
  }

  public async get(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    if (!ticket.assignedTo) {
      return interaction.reply({
        content: "This ticket is not assigned to anyone.",
        ephemeral: true,
      });
    }

    return interaction.reply({
      content: `This ticket is assigned to <@${ticket.assignedTo}>`,
      ephemeral: true,
    });
  }
}
