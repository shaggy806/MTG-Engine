import { defineCard } from "../define.js";

// EDHREC rank 3327.
//
// Rulings:
//   [2009-02-01] Soul's Majesty's only target is the creature. If that creature becomes an illegal
//     target by the time Soul's Majesty would resolve, the entire spell doesn't resolve. You won't
//     draw any cards.

export default defineCard({
  name: "Soul's Majesty",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Draw cards equal to the power of target creature you control.",
  targets: ["creature-you-control"],
  effect: { kind: "draw", amount: { powerOf: 0 } },
});
