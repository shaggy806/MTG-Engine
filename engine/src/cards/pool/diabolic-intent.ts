import { defineCard } from "../define.js";

export default defineCard({
  name: "Diabolic Intent",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Search your library for a card, put that card into your hand, then shuffle.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: {
    kind: "search-library",
    filter: {},
    destination: "hand",
    // "A card", no quality: one must be found while there is one (701.23d).
    min: 1,
    max: 1,
  },
});
