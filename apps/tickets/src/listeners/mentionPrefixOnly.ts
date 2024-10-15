import type { Events } from "@sapphire/framework";
import { Listener } from "@sapphire/framework";
import type { Message } from "discord.js";

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
  public override async run(message: Message) {
    const prefix = this.container.client.options.defaultPrefix;
    return message.channel.send("Create a ticket in <#1253458146832289925>");
  }
}
