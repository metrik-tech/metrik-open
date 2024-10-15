import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import type { StoreRegistryValue } from "@sapphire/pieces";
import {
  blue,
  gray,
  green,
  magenta,
  magentaBright,
  white,
  yellow,
} from "colorette";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "src/lib/drizzle/db";
import { kv } from "src/lib/drizzle/schema";

import * as constants from "../lib/constants";

const dev = process.env.NODE_ENV !== "production";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
  private readonly style = dev ? yellow : blue;

  public override async run() {
    this.printBanner();
    this.printStoreDebugInformation();
    await this.createGetHelpEmbed();
  }

  private async createGetHelpEmbed() {
    const baseEmbed = new EmbedBuilder()
      .setColor(constants.EMBED_COLOR)
      .setTitle("<:metrik:1196980354234470492> Metrik Support")
      .setDescription(
        "Are you having an issue with Metrik? **Select which option below best matches your issue** and we will create a ticket for you. Our team will respond as soon as possible.\n\nPlease also make sure to check out our [Documentation](https://docs.metrik.app) as your solution could be found there.\n\nYou can also email us at `hey@metrik.app` if you prefer however we cannot guarantee a swifter response.",
      );

    const components =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("account-ticket")
          .setLabel("Account")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("billing-ticket")
          .setLabel("Billing")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("sdk-ticket")
          .setLabel("SDK")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("security-ticket")
          .setLabel("Security Report")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("other-ticket")
          .setLabel("Other")
          .setStyle(ButtonStyle.Secondary),
      );

    const { client } = this.container;

    const [messageId] = await db
      .select()
      .from(kv)

      .where(eq(kv.key, "get-help-message"))
      .limit(1);

    const channel = await client.channels.fetch("1253458146832289925");

    if (!channel?.isTextBased()) return;

    if (!messageId) {
      const message = await channel.send({
        embeds: [baseEmbed],
        components: [components],
      });

      await db.insert(kv).values({
        key: "get-help-message",
        value: message.id,
      });

      return;
    }

    const message = await channel.messages.fetch(messageId.value);

    if (!message) {
      const message = await channel.send({
        embeds: [baseEmbed],
        components: [components],
      });

      await db.insert(kv).values({
        key: "get-help-message",
        value: message.id,
      });

      return;
    }

    await message.edit({
      embeds: [baseEmbed],
      components: [components],
    });

    const exists = await db
      .select({ key: kv.key })
      .from(kv)
      .where(eq(kv.key, "get-help-message"));

    if (exists.length === 0) {
      await db.insert(kv).values({
        key: "get-help-message",
        value: message.id,
      });
    } else {
      await db
        .update(kv)
        .set({ value: message.id })
        .where(eq(kv.key, "get-help-message"));
    }
  }

  private printBanner() {
    const success = green("+");

    const llc = dev ? magentaBright : white;
    const blc = dev ? magenta : blue;

    const line01 = llc("");
    const line02 = llc("");
    const line03 = llc("");

    // Offset Pad
    const pad = " ".repeat(7);

    console.log(
      String.raw`
${line01} ${pad}${blc("1.0.0")}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc("<")}${llc("/")}${blc(">")} ${llc("DEVELOPMENT MODE")}` : ""}
		`.trim(),
    );
  }

  private printStoreDebugInformation() {
    const { client, logger } = this.container;
    const stores = [...client.stores.values()];
    const last = stores.pop()!;

    for (const store of stores) logger.info(this.styleStore(store, false));
    logger.info(this.styleStore(last, true));
  }

  private styleStore(store: StoreRegistryValue, last: boolean) {
    return gray(
      `${last ? "└─" : "├─"} Loaded ${this.style(store.size.toString().padEnd(3, " "))} ${store.name}.`,
    );
  }
}
