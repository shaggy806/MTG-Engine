import { defineCard } from "../define.js";

export default defineCard({
  name: "Diabolic Tutor",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Search your library for a card, put that card into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: {},
    destination: "hand",
    // "A card", no quality: one must be found while there is one (701.23d).
    min: 1,
    max: 1,
  },
});
