import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const customTimestamp = customType<{
  data: Date;
  driverData: string;
  config: { withTimezone?: boolean; precision?: number };
}>({
  dataType(config) {
    const precision =
      typeof config?.precision !== "undefined" ? ` (${config?.precision})` : "";
    return `timestamp${precision}${
      config?.withTimezone ?? false ? " with time zone" : ""
    }`;
  },
  fromDriver(value: string): Date {
    return new Date(value);
  },
});

export const category = pgEnum("Category", [
  "GENERAL",
  "BILLING",
  "SDK",
  "OTHER",
  "ACCOUNT",
  "SECURITY",
]);
export const level = pgEnum("Level", ["STALE", "NEW", "LOW", "MEDIUM", "HIGH"]);
export const team = pgEnum("Team", [
  "ENGINEERING",
  "BILLING",
  "SUPPORT",
  "MODERATION",
  "TRIAGE",
  "EXECUTIVE",
]);

export const kv = pgTable("kv", {
  key: text("key").primaryKey().notNull(),
  value: text("value").notNull(),
});

export const Ticket = pgTable("Ticket", {
  id: serial("id").primaryKey().notNull(),
  channelId: text("channelId").notNull(),
  userId: text("userId").notNull(),
  assignedTo: text("assignedTo"),
  team: team("team").default("TRIAGE").notNull(),
  level: level("level").default("NEW").notNull(),
  category: category("category").default("OTHER").notNull(),
  reason: text("reason").notNull(),
  closedAt: customTimestamp("closedAt", { precision: 3 }),
  closedBy: text("closedBy"),
  closed: boolean("closed").default(false),
  solved: boolean("solved"),
  closingNotes: text("closingNotes"),
  createdAt: customTimestamp("createdAt", { precision: 3 }).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
});

export const Message = pgTable("Message", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId").notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  createdAt: customTimestamp("createdAt", { precision: 3 }).notNull(),
  replyingTo: text("replyingTo"),
  ticketId: integer("ticketId").references(() => Ticket.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});
