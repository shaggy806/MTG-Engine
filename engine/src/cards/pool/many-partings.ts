import { defineCard } from "../define.js";

export default defineCard({
  name: "Many Partings",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a basic land card, reveal it, put it into your hand, then shuffle. Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
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
      { kind: "create-token", token: "Food Token", count: 1 },
    ],
  },
});
