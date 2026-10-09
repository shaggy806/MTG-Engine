import { defineCard } from "../define.js";

// EDHREC rank 1283. God-Eternal Bontu's shape: the chosen lands are
// sacrificed together (rule 608.2c), then the search finds up to as many
// land cards as were actually sacrificed — any land card, basic or not.
const TEXT =
  "Sacrifice any number of lands. Search your library for up to that many land cards, put them onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Scapeshift",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: TEXT,
  targets: [],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "choose-permanents",
        filter: { type: "land", controlledBy: "you" },
        upTo: { countOf: { type: "land", controlledBy: "you" } },
        then: { kind: "sacrifice-target", target: 0 },
        prompt: "Sacrifice any number of lands",
      },
      {
        kind: "search-library",
        filter: { type: "land" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: { thisWay: "sacrificed" },
      },
    ],
  },
});
