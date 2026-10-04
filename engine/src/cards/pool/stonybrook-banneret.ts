import { defineCard } from "../define.js";

// EDHREC rank 3078.
//
// Rulings:
//   [2008-04-01] The effect reduces the total cost of the spell, regardless of whether you chose
//     to pay additional or alternative costs.
//   [2008-04-01] A spell you cast that's both creature types costs {1} less to cast, not {2} less.
//     (One static, `subtypes` an OR — reduced once.)

const REDUCE_TEXT = "Merfolk spells and Wizard spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Stonybrook Banneret",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 1,
  keywords: ["islandwalk"],
  text: `Islandwalk (This creature can't be blocked as long as defending player controls an Island.)\n${REDUCE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtypes: ["Merfolk", "Wizard"] }, caster: "you", reduceGeneric: 1 },
      text: REDUCE_TEXT,
    },
  ],
});
