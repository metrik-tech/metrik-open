import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { capitalizeFirstLetter } from "@sapphire/utilities";
import { ChannelType } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { team as teamEnum, Ticket } from "src/lib/drizzle/schema";
import { getActiveTicket, sendUpdate } from "src/lib/ticket";

@ApplyOptions<Subcommand.Options>({
  description: "Manage the team of a ticket",
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
            .setDescription("Set the team assigned to the ticket")
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
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("get")
            .setDescription("Get the team assigned to the ticket"),
        ),
    );
  }

  public async set(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    const team = interaction.options.getString("team") as
      | (typeof teamEnum.enumValues)[number]
      | null;

    if (!team) return;

    const [ticketRecord] = await db
      .update(Ticket)
      .set({ team: team })
      .where(eq(Ticket.id, ticket.id))
      .returning();

    await sendUpdate("team", ticketRecord!);

    return interaction.reply({
      content: `Team updated to ${capitalizeFirstLetter((team ?? "SUPPORT").toLowerCase())}`,
    });
  }

  public async get(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    return interaction.reply({
      content: `Team is ${capitalizeFirstLetter(ticket.team.toLowerCase())}`,
    });
  }
}
