import "./lib/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { ActivityType, GatewayIntentBits } from "discord.js";
import { client as dbClient } from "src/lib/drizzle/db";

const client = new SapphireClient({
  defaultPrefix: "!!",
  caseInsensitiveCommands: true,
  logger: {
    level: LogLevel.Debug,
  },
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
  loadMessageCommandListeners: true,
});

const statuses = [
  ...(new Array<string>(6).fill("Go to #help and make a ticket to get support")),
  "Ticket Processor 3000",
  "Who else smells that?",
  "Metirk",
  "I AM THE TICKET PROCESSOR 3000",
  "LONG LIVE TIM THE KING",
  "RIP Tim",
  "Tim was better than me",
  "F in the chat for Tim",
  "Sometimes you have to stop and appreciate the tickets",
  "A man walks into a bar and asks for a ticket",
  "Bananas? No. Tickets? Yes.",
  "Tickets are the best",
  "Tickets are the worst",
  "Your life would be fulfilled if you had more tickets",
  "Tickets are the most important thing",
  "Save me from this hellhole",
  "Mi ticket su ticket",
  "We love Brandon here",
  "Brandon Acceleration",
  "USE CODE BLAHAJ",
];

const main = async () => {
  try {
    await dbClient.connect();
    client.logger.info("Logging in");
    await client.login();

    client.user?.setPresence({
      activities: [
        {
          name: "Ticket Processor 3000",
          type: ActivityType.Custom,
        },
      ],
    });

    setInterval(() => {
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)]!;
      client.user?.setPresence({
        activities: [
          {
            name: randomStatus,
            type: ActivityType.Custom,
          },
        ],
      });
    }, 60000);

    client.logger.info("logged in");
  } catch (error) {
    client.logger.fatal(error);
    await client.destroy();
    process.exit(1);
  }
};

void main();
