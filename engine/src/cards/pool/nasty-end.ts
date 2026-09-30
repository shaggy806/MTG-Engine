import { defineCard } from "../define.js";

export default defineCard({
  name: "Nasty End",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Draw two cards. If the sacrificed creature was legendary, draw three cards instead.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: {
    kind: "conditional",
    condition: { kind: "sacrificed", filter: { supertype: "legendary" } },
    then: { kind: "draw", amount: 3 },
    else: { kind: "draw", amount: 2 },
  },
});
