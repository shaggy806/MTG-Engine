import { defineCard } from "../define.js";

// EDHREC rank 4765.
//
// Rulings:
//   [2022-10-07] If the chosen creature is an illegal target as Mandate of Abaddon tries to
//     resolve, it will be removed from the stack and no creatures will be destroyed.
// Fell the Mighty's shape the other way round: the target's power is read as
// the spell resolves, and the target isn't "less than" itself, so it survives.

export default defineCard({
  name: "Mandate of Abaddon",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Choose target creature you control. Destroy all creatures with power less than that creature's power.",
  targets: ["creature-you-control"],
  effect: {
    kind: "destroy-all",
    filter: { type: "creature", power: { op: "lt", n: { amount: { powerOf: 0 } } } },
  },
});
