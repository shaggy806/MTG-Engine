import { defineCard } from "../define.js";

// EDHREC rank 2756.
//
// Rulings:
//   [2025-01-24] Heartless Summoning's first ability can only reduce the generic mana portion of a
//     creature spell's cost.

const COST_TEXT = "Creature spells you cast cost {2} less to cast.";
const SHRINK_TEXT = "Creatures you control get -1/-1.";

export default defineCard({
  name: "Heartless Summoning",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${COST_TEXT}\n${SHRINK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "creature" }, caster: "you", reduceGeneric: 2 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [-1, -1],
      text: SHRINK_TEXT,
    },
  ],
});
