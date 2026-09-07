import { defineCard } from "../define.js";

export default defineCard({
  name: "Demonic Tutor",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Search your library for a card, put that card into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: {},
    destination: "hand",
    min: 0,
    max: 1,
  },
});
