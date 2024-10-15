import { join } from "path";
import { type level } from "src/lib/drizzle/schema";

export const rootDir = join(__dirname, "..", "..");
export const srcDir = join(rootDir, "src");

export const METRIK_TEAM_ROLE_ID = "1174870651291578438";
export const TICKETS_CATEGORY_ID = "1253443244990140448";
export const CLOSED_TICKETS_CATEGORY_ID = "1253599170527363102";
export const EMBED_COLOR = "#3b82f6";
export const BOT_USER_ID = "1229449210479382609";
export const CHANNEL_NAME_SEPARATOR = "｜";

export const LEVEL_EMOJIS = {
  STALE: "⚪️",
  NEW: "🟣",
  LOW: "🟡",
  MEDIUM: "🟠",
  HIGH: "🔴",
} satisfies Record<
  (typeof level.enumValues)[number],
  "⚪️" | "🟣" | "🟡" | "🟠" | "🔴"
>;

export const PARSE_USERNAME = (username: string) =>
  username.replace(/[@.]/g, "").replace("_", "-");
