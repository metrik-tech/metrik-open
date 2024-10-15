import { relations } from "drizzle-orm/relations";

import { Message, Ticket } from "./schema";

export const MessageRelations = relations(Message, ({ one }) => ({
  ticket: one(Ticket, {
    fields: [Message.ticketId],
    references: [Ticket.id],
  }),
}));

export const TicketRelations = relations(Ticket, ({ many }) => ({
  transcript: many(Message),
}));
