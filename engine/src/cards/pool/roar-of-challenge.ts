import { defineCard } from "../define.js";

// EDHREC rank 6663.
//
// Rulings:
//   [2014-09-20] Ferocious abilities of instants and sorceries that don't use the word "instead"
//     will provide an additional effect if you control a creature with power 4 or greater as they
//     resolve.
//   [2014-09-20] If, during the declare blockers step, a creature is tapped or is affected by a
//     spell or ability that says it can't block, then it doesn't block. If there's a cost
//     associated with having that creature block, its controller isn't forced to pay that cost.
//   [2014-09-20] Roar of Challenge doesn't give any creatures the ability to block the target
//     creature. It just forces those creatures that are already able to block the creature to do
//     so.

const LURE_TEXT = "All creatures able to block target creature this turn do so.";
const FEROCIOUS_TEXT =
  "Ferocious — That creature gains indestructible until end of turn if you control a creature with power 4 or greater.";

// The lure is Lure's `must-be-blocked` (rule 509.1c) on the target for the
// turn; ferocious is checked as it resolves (the ruling).
export default defineCard({
  name: "Roar of Challenge",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: `${LURE_TEXT}\n${FEROCIOUS_TEXT}`,
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "restrict", target: 0, restrictions: ["must-be-blocked"] },
      {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "creature", power: { op: "gte", n: 4 } }, atLeast: 1 },
        then: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      },
    ],
  },
});
