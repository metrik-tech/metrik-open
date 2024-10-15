import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { capitalizeFirstLetter } from "@sapphire/utilities";
import { ChannelType } from "discord.js";
import { eq } from "drizzle-orm";
import { LEVEL_EMOJIS } from "src/lib/constants";
import { db } from "src/lib/drizzle/db";
import { level as levelEnum, Ticket } from "src/lib/drizzle/schema";
import {
  getActiveTicket,
  sendUpdate,
  setTicketLevelInChannelName,
  sortTickets,
} from "src/lib/ticket";

@ApplyOptions<Subcommand.Options>({
  description: "A basic slash command",
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
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("set")
            .setDescription("Set the ticket level")
            .addStringOption((option) =>
              option
                .setName("level")
                .setDescription("Level of the ticket")
                .setRequired(true)
                .addChoices(
                  levelEnum.enumValues.map((level) => ({
                    name: `${LEVEL_EMOJIS[level]} ${capitalizeFirstLetter(level.toLowerCase())}`,
                    value: level,
                  })),
                ),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("get").setDescription("Get the ticket level"),
        ),
    );
  }

  public async set(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    const level = interaction.options.getString("level") as
      | (typeof levelEnum.enumValues)[number]
      | null;

    console.log(level);

    const [[ticketRecord]] = await Promise.all([
      db
        .update(Ticket)
        .set({ level: level ?? "LOW" })
        .where(eq(Ticket.id, ticket.id))
        .returning(),
      setTicketLevelInChannelName(level ?? "LOW", ticket),
    ]);

    await sendUpdate("level", ticketRecord!);
    await sortTickets(interaction);

    return interaction.reply({
      content: `Level updated to ${LEVEL_EMOJIS[level ?? "LOW"]} ${capitalizeFirstLetter(level ?? "LOW")}`,
    });
  }

  public async get(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    const ticket = await getActiveTicket(interaction);

    if (!ticket) return;

    return interaction.reply({
      content: `Level is ${LEVEL_EMOJIS[ticket.level]} ${capitalizeFirstLetter(ticket.level)}`,
    });
  }
}
