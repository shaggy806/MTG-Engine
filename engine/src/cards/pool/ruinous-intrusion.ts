import { defineCard } from "../define.js";

// EDHREC rank 5316.
//
// Rulings:
//   [2021-09-24] Use the permanent's characteristics as it last existed on the battlefield to
//     determine the value of X.
// `thisWay: "exiled"` with `sumOf: "mana-value"` reads a permanent that left
// through its last-known information (a token through its ceased snapshot).

export default defineCard({
  name: "Ruinous Intrusion",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Exile target artifact or enchantment. Put X +1/+1 counters on target creature you control, where X is the mana value of the permanent exiled this way.",
  targets: ["artifact-or-enchantment", "creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "add-counter", target: 1, counter: "+1/+1", amount: { thisWay: "exiled", sumOf: "mana-value" } },
    ],
  },
});
