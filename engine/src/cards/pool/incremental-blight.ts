import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 6202.
//
// Rulings:
//   [2008-05-01] You must target three different creatures. If you can't, you can't cast
//     Incremental Blight.

export default defineCard({
  name: "Incremental Blight",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Put a -1/-1 counter on target creature, two -1/-1 counters on another target creature, and three -1/-1 counters on a third target creature.",
  targets: distinctTargets(3, "creature"),
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
      { kind: "add-counter", target: 1, counter: "-1/-1", amount: 2 },
      { kind: "add-counter", target: 2, counter: "-1/-1", amount: 3 },
    ],
  },
});
