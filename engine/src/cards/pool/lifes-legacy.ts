import { defineCard } from "../define.js";

// EDHREC rank 2525. Fling's shape: the sacrificed creature's power as it
// last existed on the battlefield (rule 608.2h).
//
// Rulings:
//   [2014-07-18] You must sacrifice exactly one creature to cast this spell; you can't cast it
//     without sacrificing a creature, and you can't sacrifice additional creatures.

export default defineCard({
  name: "Life's Legacy",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nDraw cards equal to the sacrificed creature's power.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "draw", amount: { powerOf: "sacrificed" } },
});
