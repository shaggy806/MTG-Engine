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
    min: 0,
    max: 1,
  },
});
