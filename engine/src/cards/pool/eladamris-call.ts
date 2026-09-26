import { defineCard } from "../define.js";

export default defineCard({
  name: "Eladamri's Call",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  types: ["instant"],
  text: "Search your library for a creature card, reveal that card, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "creature" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
