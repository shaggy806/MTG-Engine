import { defineCard } from "../define.js";

// EDHREC rank 2925.
//
// Rulings:
//   [2025-10-02] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying, add any cost increases, then apply any cost reductions. The mana value
//     of the spell remains unchanged, no matter what the total cost to cast it was.
const COST_TEXT = "Noncreature spells you cast cost {1} less to cast.";
const CAST_TEXT = "Whenever you cast a noncreature spell, Longshot deals 2 damage to each opponent.";

export default defineCard({
  name: "Longshot, Rebel Bowman",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rebel", "Ally"],
  power: 3,
  toughness: 3,
  keywords: ["reach"],
  text: `Reach (This creature can block creatures with flying.)\n${COST_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { notTypes: ["creature"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
