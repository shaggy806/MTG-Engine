import { defineCard } from "../define.js";

export default defineCard({
  name: "Fabricate",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Search your library for an artifact card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "artifact" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
