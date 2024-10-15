import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  OverwriteType,
  type MessageActionRowComponentBuilder,
  type ModalSubmitInteraction,
} from "discord.js";
import { db } from "src/lib/drizzle/db";
import { Ticket, type category as categoryEnum } from "src/lib/drizzle/schema";
import { getLinkedUser } from "src/lib/metrik";
import { sortTickets } from "src/lib/ticket";

import * as constants from "../lib/constants";
import { buttons } from "./ticketCreateButton";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
})
export class ModalHandler extends InteractionHandler {
  public override parse(interaction: ModalSubmitInteraction) {
    console.log(interaction.customId);
    const customIds = buttons.map(
      (button) => `create-ticket-${button.split("-")[0]}`,
    );

    if (!customIds.includes(interaction.customId)) return this.none();

    return this.some();
  }

  private async getChannelName(
    interaction: ModalSubmitInteraction,
    ticketType: string,
    count?: number,
  ): Promise<string> {
    const existingChannel = interaction.guild?.channels.cache
      .map((value) => value.name)
      .find(
        (value) =>
          value ===
          `${ticketType}-${constants.PARSE_USERNAME(interaction.user.username)}${count ? `-${count}` : ""}`,
      );

    if (existingChannel)
      return await this.getChannelName(
        interaction,
        ticketType,
        (count ?? 1) + 1,
      );

    return `${ticketType}-${constants.PARSE_USERNAME(interaction.user.username)}${count ? `-${count}` : ""}`;
  }

  public async run(interaction: ModalSubmitInteraction) {
    const ticketType = interaction.customId.split("create-ticket-")[1] as
      | "general"
      | "account"
      | "sdk"
      | "billing"
      | "security"
      | "other";
    const input = interaction.fields.getTextInputValue("reason");

    console.log(ticketType, input, interaction.guild);

    const newChannel = await interaction.guild?.channels.create({
      name: `${constants.LEVEL_EMOJIS.NEW}${constants.CHANNEL_NAME_SEPARATOR}${ticketType}${constants.CHANNEL_NAME_SEPARATOR}${constants.PARSE_USERNAME(interaction.user.username)}`,
      type: ChannelType.GuildText,
      parent: constants.TICKETS_CATEGORY_ID,
      permissionOverwrites: [
        {
          id: interaction.member!.user.id,
          type: OverwriteType.Member,
          allow: ["SendMessages", "ViewChannel"],
        },
        {
          id: constants.METRIK_TEAM_ROLE_ID,
          type: OverwriteType.Role,
          allow: ["SendMessages", "ViewChannel"],
        },
        {
          id: interaction.guild?.roles.everyone.id,
          type: OverwriteType.Role,
          deny: ["SendMessages", "ViewChannel"],
        },
      ],
      //category
    });

    const [ticket] = await db
      .insert(Ticket)
      .values({
        createdAt: interaction.createdAt,
        reason: input,
        level: "NEW",
        category:
          ticketType.toUpperCase() as (typeof categoryEnum.enumValues)[number],
        userId: interaction.user.id,
        channelId: newChannel!.id,
      })
      .returning();

    const embed = new EmbedBuilder()
      .setColor(constants.EMBED_COLOR)
      .setTitle("Ticket created")
      .addFields([
        {
          name: "Ticket #",
          value: `${ticket!.id}`,
        },
        {
          name: "User",
          value: `<@${interaction.user.id}>`,
        },
        {
          name: "Message",
          value: `${input}`,
        },
        {
          name: "Category",
          value: `\`${ticketType.toUpperCase()}\``,
        },
        {
          name: "Created at",
          value: `<t:${Math.floor(ticket!.createdAt.getTime() / 1000)}:f>`,
        },
      ]);

    const [user] = await Promise.all([
      getLinkedUser(interaction.user.id),
      newChannel?.send({
        embeds: [embed],
      }),
      sortTickets(interaction),
      interaction.reply({
        content: `Ticket created in <#${newChannel?.id}>`,
        ephemeral: true,
      }),
    ]);

    if (!user) {
      await newChannel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor(constants.EMBED_COLOR)
            .setTitle(":x: No Metrik account linked")
            .setDescription(
              "We could not find a Metrik account linked to your Discord account. Please click the link below to bring up your User Settings page where you can link your Discord account.\n\nAfter you have linked an account, run `/link` in this channel so we can check if you have connected your Metrik account.",
            ),
        ],
        components: [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("Open Metrik User Settings")
              .setStyle(ButtonStyle.Link)
              .setURL(`https://alpha.metrik.app/user/settings`),
          ),
        ],
      });
    } else {
      await newChannel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor(constants.EMBED_COLOR)
            .setTitle(
              `:white_check_mark: Metrik account \`${user.name}\` linked`,
            )
            .setDescription(
              `We have found the Metrik account \`${user.name}\` linked to your Discord account. This is the account you will be receiving support for.\n\nIf you wish to change which Discord account is linked to your Metrik account, please click the link below to bring up your User Settings page..`,
            ),
        ],
        components: [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("Open Metrik User Settings")
              .setStyle(ButtonStyle.Link)
              .setURL(`https://alpha.metrik.app/user/settings`),
          ),
        ],
      });
    }
  }
}
