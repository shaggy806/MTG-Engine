import { defineCard } from "../define.js";

// Top-commanders rank 109. "Their second spell each turn" is the caster's
// own count, which is what `spellsThisTurn` on the cast event is.
export default defineCard({
  name: "Kraum, Ludevic's Opus",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Horror"],
  power: 4,
  toughness: 4,
  pairing: { kind: "partner" },
  keywords: ["flying", "haste"],
  text:
    "Flying, haste\n" +
    "Whenever an opponent casts their second spell each turn, draw a card.\n" +
    "Partner (You can have two commanders if both have partner.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever an opponent casts their second spell each turn, draw a card.",
    },
  ],
});
