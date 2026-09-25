import { defineCard } from "../define.js";

export default defineCard({
  name: "Sarkhan's Triumph",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Search your library for a Dragon creature card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { subtype: "Dragon", type: "creature" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
