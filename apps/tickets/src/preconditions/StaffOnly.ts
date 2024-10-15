import { Precondition } from "@sapphire/framework";
import type {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Message,
} from "discord.js";
import { METRIK_TEAM_ROLE_ID } from "src/lib/constants";

export class StaffOnlyPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const guildUser = await interaction.guild?.members.fetch(
      interaction.user.id,
    );

    if (!guildUser?.roles.cache.has(METRIK_TEAM_ROLE_ID))
      return this.error({
        message: "You must be a Metrik team member to use this command.",
      });

    return this.ok();
  }
}

declare module "@sapphire/framework" {
  interface Preconditions {
    StaffOnly: never;
  }
}
