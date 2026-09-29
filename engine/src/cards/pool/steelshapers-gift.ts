import { defineCard } from "../define.js";

export default defineCard({
  name: "Steelshaper's Gift",
  manaCost: "{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Search your library for an Equipment card, reveal that card, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { subtype: "Equipment" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
