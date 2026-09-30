import { defineCard } from "../define.js";

export default defineCard({
  name: "Unmarked Grave",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Search your library for a nonlegendary card, put that card into your graveyard, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { notSupertype: "legendary" },
    destination: "graveyard",
    min: 0,
    max: 1,
  },
});
