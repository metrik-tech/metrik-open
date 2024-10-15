import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { AttachmentBuilder } from "discord.js";
import { ListObjectsV2Command, S3 } from "src/lib/s3";

@ApplyOptions<Subcommand.Options>({
  description: "SDK-related commands",
  subcommands: [
    {
      name: "nightly-build",
      chatInputRun: "run",
    },
  ],
})
export class UserCommand extends Subcommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((builder) =>
          builder //
            .setName("nightly-build")
            .setDescription("Get the latest nightly build of the SDK"),
        ),
    );
  }

  public async run(interaction: Subcommand.ChatInputCommandInteraction) {
    const listCommand = new ListObjectsV2Command({
      Bucket: "cdn",
      Prefix: "sdk/artifacts",
    });

    const response = await S3.send(listCommand);

    if (!response.Contents) {
      return new Response("No artifacts found", { status: 404 });
    }

    const latestArtifact = response.Contents.reduce((a, b) => {
      if (a.LastModified!.getTime() > b.LastModified!.getTime()) {
        return a;
      }

      return b;
    });

    const artifact = await fetch(
      `https://cdn.metrik.app/${latestArtifact.Key}`,
    );

    if (!artifact.body) {
      return;
    }

    const attachment = new AttachmentBuilder(
      Buffer.from(await artifact.arrayBuffer()),
      {
        name: "Metrik.rbxm",
      },
    );

    return interaction.reply({
      files: [attachment],
      ephemeral: true,
    });
  }
}
