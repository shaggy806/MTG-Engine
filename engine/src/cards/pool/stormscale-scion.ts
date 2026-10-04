import { defineCard } from "../define.js";

// EDHREC rank 4815.
//
// Rulings:
//   [2025-04-04] The copies are put directly onto the stack. They aren’t cast and won’t be counted
//     by other spells with storm cast later in the turn.
//   [2025-04-04] Spells cast from zones other than a player’s hand and spells that were countered
//     or otherwise failed to resolve are counted by the storm ability.
//   [2025-04-04] A copy of a spell can be countered like any other spell, but it must be countered
//     individually. Countering a spell with storm won’t affect the copies.
//   [2025-04-04] The triggered ability that creates the copies can itself be countered by anything
//     that can counter a triggered ability. If it is countered, no copies will be put onto the
//     stack.

export default defineCard({
  name: "Stormscale Scion",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nOther Dragons you control get +1/+1.\nStorm (When you cast this spell, copy it for each spell cast before it this turn. Copies become tokens.)",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Dragon" },
      grantPt: [1, 1],
      text: "Other Dragons you control get +1/+1.",
    },
  ],
  triggered: [
    {
      // Aeve, Progenitor Ooze's storm: each copy resolves into a token.
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm (When you cast this spell, copy it for each spell cast before it this turn. Copies become tokens.)",
    },
  ],
});
