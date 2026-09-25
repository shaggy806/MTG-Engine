import { defineCard } from "../define.js";

export default defineCard({
  name: "Sylvan Scrying",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a land card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "land" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
