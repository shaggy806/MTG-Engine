import { defineCard } from "../define.js";

export default defineCard({
  name: "Buried Alive",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Search your library for up to three creature cards, put them into your graveyard, " +
    "then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "creature" },
    destination: "graveyard",
    min: 0,
    max: 3,
  },
});
