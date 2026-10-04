import { defineCard } from "../define.js";

// EDHREC rank 4452.
//
// Rulings:
//   [2013-04-15] You must sacrifice exactly one creature to cast this spell; you cannot cast it
//     without sacrificing a creature, and you cannot sacrifice additional creatures.

export default defineCard({
  name: "Altar's Reap",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nDraw two cards.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "draw", amount: 2 },
});
