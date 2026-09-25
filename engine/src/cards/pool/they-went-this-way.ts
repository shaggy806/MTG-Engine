import { defineCard } from "../define.js";

export default defineCard({
  name: "They Went This Way",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a basic land card, put it onto the battlefield tapped, then shuffle. Investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      { kind: "create-token", token: "Clue Token", count: 1 },
    ],
  },
});
