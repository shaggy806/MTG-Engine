import { defineCard } from "../define.js";

export default defineCard({
  name: "Lay of the Land",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
