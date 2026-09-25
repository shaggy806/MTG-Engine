import { defineCard } from "../define.js";

export default defineCard({
  name: "Call the Gatewatch",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Search your library for a planeswalker card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "planeswalker" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
