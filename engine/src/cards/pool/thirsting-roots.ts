import { defineCard } from "../define.js";

export default defineCard({
  name: "Thirsting Roots",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Choose one —\n• Search your library for a basic land card, reveal it, put it into your hand, then shuffle.\n• Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
        effect: {
          kind: "search-library",
          filter: { supertype: "basic", type: "land" },
          destination: "hand",
          min: 0,
          max: 1,
          reveal: true,
        },
      },
      { text: "Proliferate.", effect: { kind: "proliferate" } },
    ],
  },
});
