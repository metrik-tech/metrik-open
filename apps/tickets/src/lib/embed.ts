import { EmbedBuilder } from "discord.js";

import { EMBED_COLOR } from "./constants";

export const TimEmbedBuilder = new EmbedBuilder({
  color: parseInt(EMBED_COLOR.split("#")[1]!, 16),
  footer: {
    text: "Metrik Support System",
  },
});
