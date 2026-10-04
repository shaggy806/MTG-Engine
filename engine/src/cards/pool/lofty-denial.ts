import { defineCard } from "../define.js";

// EDHREC rank 5295.
//
// Rulings:
//   [2020-06-23] If you control more than one creature with flying, Lofty Denial still requires
//     only {4}.

// Spell Stutter's `payGeneric`, sized as it resolves: {4} while the caster
// controls any creature with flying, else {1} (Ilysian Caryatid's
// `ifCondition` amount).
export default defineCard({
  name: "Lofty Denial",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {1}. If you control a creature with flying, counter that spell unless its controller pays {4} instead.",
  targets: ["spell"],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [
      {
        payGeneric: {
          ifCondition: { kind: "controls", filter: { type: "creature", keyword: "flying" }, atLeast: 1 },
          then: 4,
          else: 1,
        },
        text: "Pay {1} ({4} if Lofty Denial's controller controls a creature with flying).",
      },
    ],
    otherwise: { kind: "counter", target: 0 },
  },
});
