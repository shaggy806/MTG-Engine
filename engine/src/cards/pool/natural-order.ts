import { defineCard } from "../define.js";

export default defineCard({
  name: "Natural Order",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "As an additional cost to cast this spell, sacrifice a green creature.\n" +
    "Search your library for a green creature card, put it onto the battlefield, then shuffle.",
  additionalCost: { sacrifice: { type: "creature", colors: ["G"], controlledBy: "you" } },
  effect: {
    kind: "search-library",
    filter: { type: "creature", colors: ["G"] },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
});
