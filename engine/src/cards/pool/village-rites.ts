import { defineCard } from "../define.js";

export default defineCard({
  name: "Village Rites",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Draw two cards.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "draw", amount: 2 },
});
