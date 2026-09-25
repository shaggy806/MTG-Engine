import { defineCard } from "../define.js";

export default defineCard({
  name: "Trapmaker's Snare",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Search your library for a Trap card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { subtype: "Trap" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
