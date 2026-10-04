import { defineCard } from "../define.js";

// EDHREC rank 5144.
// The Gold Saucer's flip-coin shape, with Alrund's Epiphany's extra turn as
// the `won` branch.

export default defineCard({
  name: "Stitch in Time",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["sorcery"],
  text: "Flip a coin. If you win the flip, take an extra turn after this one.",
  effect: { kind: "flip-coin", won: { kind: "take-extra-turn" } },
});
