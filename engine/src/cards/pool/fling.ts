import { defineCard } from "../define.js";

// The sacrificed creature's power as it last existed on the battlefield
// (rule 608.2h).
export default defineCard({
  name: "Fling",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Fling deals damage equal to the sacrificed creature's power to any target.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  targets: ["any-target"],
  effect: { kind: "damage", target: 0, amount: { powerOf: "sacrificed" } },
});
