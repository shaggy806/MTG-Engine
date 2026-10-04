import { defineCard } from "../define.js";

// EDHREC rank 3116.
//
// Rulings:
//   [2022-12-08] If multiple "extra turn" effects resolve in the same turn, take them in the
//     reverse of the order that the effects resolved. (`extraTurns` is taken last-in first-out.)

export default defineCard({
  name: "Temporal Manipulation",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Take an extra turn after this one.",
  effect: { kind: "take-extra-turn" },
});
