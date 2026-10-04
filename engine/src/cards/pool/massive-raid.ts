import { defineCard } from "../define.js";

// EDHREC rank 6277.
//
// Rulings:
//   [2013-01-24] Count the number of creatures you control when Massive Raid resolves to determine
//     how much damage is dealt.

export default defineCard({
  name: "Massive Raid",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Massive Raid deals damage to any target equal to the number of creatures you control.",
  // The count is read as it resolves (the ruling) — Kabira Takedown's shape.
  targets: ["any-target"],
  effect: { kind: "damage", target: 0, amount: { countOf: { type: "creature", controlledBy: "you" } } },
});
