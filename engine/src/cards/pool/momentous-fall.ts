import { defineCard } from "../define.js";

// EDHREC rank 2585.
//
// Rulings:
//   [2010-06-15] The sacrificed creature's last known existence on the battlefield is checked to
//     determine its power and its toughness.
//   [2013-04-15] You must sacrifice exactly one creature to cast this spell; you cannot cast it
//     without sacrificing a creature, and you cannot sacrifice additional creatures.

export default defineCard({
  name: "Momentous Fall",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "You draw cards equal to the sacrificed creature's power, then you gain life equal to its toughness.",
  // Fling's additional cost and `"sacrificed"` reads (last-known information).
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: { powerOf: "sacrificed" } },
      { kind: "gain-life", amount: { toughnessOf: "sacrificed" } },
    ],
  },
});
