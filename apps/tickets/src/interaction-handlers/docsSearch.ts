import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ApplicationCommandType,
  type ApplicationCommandOptionChoiceData,
  type AutocompleteInteraction,
} from "discord.js";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class AutocompleteHandler extends InteractionHandler {
  public override async run(
    interaction: AutocompleteInteraction,
    result: ApplicationCommandOptionChoiceData[],
  ) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    if (interaction.commandType !== ApplicationCommandType.ChatInput)
      return this.none();
    if (
      interaction.commandName !== "docs" ||
      interaction.options.getSubcommand() !== "search"
    )
      return this.none();
    // Get the focussed (current) option
    const focusedOption = interaction.options.getFocused(true);
    // Ensure that the option name is one that can be autocompleted, or return none if not.
    switch (focusedOption.name) {
      case "query": {
        // Search your API or similar. This is example code!
        const serarchReq = await fetch(
          "https://api.mintlifytrieve.com/api/chunk/search",
          {
            method: "POST",
            body: JSON.stringify({
              query: `${focusedOption.value}`,
              search_type: "hybrid",
              highlight_delimiters: ["?", ",", ".", "!", " ", "\n"],
              score_threshold: 0.2,
              filters: {
                must_not: [
                  {
                    field: "metadata",
                    have: ["openapi"],
                  },
                ],
              },
              highlight_window: 30,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: "tr-Ef0O1GG473PDFHfclCabtti5n0mHNolw",
              "Tr-Dataset": "fcdc80ba-d894-43eb-b7cf-e120bae6ee89",
            },
          },
        );

        const searchResult = (await serarchReq.json()) as {
          score_chunks: {
            metadata: {
              link: string;
              metadata: {
                title: string;
              };
            }[];
          }[];
        };

        const results = searchResult.score_chunks.map((match) => ({
          name: match.metadata[0]!.metadata.title,
          value: `https://docs.metrik.app/${match.metadata[0]!.link}`,
        }));

        // filter out duplicate titles
        const uniqueResults = [...new Set(results.map((result) => result.name))]
          .map((name) => results.find((result) => result.name === name))
          .filter((result) => result !== undefined);

        // Map the search results to the structure required for Autocomplete
        return this.some(
          uniqueResults.map((match) => ({
            name: match.name,
            value: match.value,
          })),
        );
      }
      default:
        return this.none();
    }
  }
}
