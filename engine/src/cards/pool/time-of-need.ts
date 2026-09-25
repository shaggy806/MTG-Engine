import { defineCard } from "../define.js";

export default defineCard({
  name: "Time of Need",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a legendary creature card, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { supertype: "legendary", type: "creature" },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
