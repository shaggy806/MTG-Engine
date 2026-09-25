import { defineCard } from "../define.js";

export default defineCard({
  name: "Environmental Sciences",
  manaCost: "{2}",
  colors: [],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Search your library for a basic land card, reveal it, put it into your hand, then shuffle. You gain 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      { kind: "gain-life", amount: 2 },
    ],
  },
});
