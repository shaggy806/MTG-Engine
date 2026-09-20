import { defineCard } from "../define.js";

export default defineCard({
  name: "Entomb",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Search your library for a card, put that card into your graveyard, then shuffle.",
  effect: {
    kind: "search-library",
    // No clauses — "a card", any card at all.
    filter: {},
    destination: "graveyard",
    min: 1,
    max: 1,
  },
});
