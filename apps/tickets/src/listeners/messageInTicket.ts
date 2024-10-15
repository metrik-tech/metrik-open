import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ChannelType, type Message } from "discord.js";
import { eq } from "drizzle-orm";
import { extension } from "mime-types";
import { db } from "src/lib/drizzle/db";
import { Message as MessageTable, Ticket } from "src/lib/drizzle/schema";
import { getActiveTicket } from "src/lib/ticket";

import { BOT_USER_ID, TICKETS_CATEGORY_ID } from "../lib/constants";
import { S3 } from "../lib/s3";

@ApplyOptions<Listener.Options>({})
export class UserEvent extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: "messageCreate",
    });
  }

  public override async run(message: Message) {
    if (message.channel.type !== ChannelType.GuildText) return;
    if (message.channel.parentId !== TICKETS_CATEGORY_ID) return;
    if (message.author.id === BOT_USER_ID || message.author.bot) return;

    const [ticket] = await db
      .select()
      .from(Ticket)

      .where(eq(Ticket.channelId, message.channelId))
      .limit(1);

    if (!ticket) return;

    const attachmentsPromise = message.attachments.map(async (attachment) => {
      const attachmentReq = await fetch(attachment.url);
      const buffer = await attachmentReq.arrayBuffer();

      const key = `${ticket.channelId}/${message.id}/${attachment.id}`;

      const command = new PutObjectCommand({
        Bucket: "ticket-attachments",
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: attachment.contentType ?? attachmentReq.type,
      });

      const response = await S3.send(command);

      if (response.$metadata.httpStatusCode !== 200) {
        return attachment.url;
      }

      return `https://ta.metrik.app/${key}`;
    });

    const attachments = await Promise.all(attachmentsPromise);

    await db.insert(MessageTable).values({
      ticketId: ticket.id,
      id: message.id,
      content: message.content,
      attachments,
      userId: message.author.id,
      createdAt: message.createdAt,
      replyingTo: message.reference?.messageId,
    });
  }
}
