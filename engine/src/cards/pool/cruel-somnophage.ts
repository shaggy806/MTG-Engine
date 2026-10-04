import { defineCard } from "../define.js";

// EDHREC rank 4979.
//
// Rulings:
//   [2023-09-01] The ability that defines Cruel Somnophage's power and toughness functions in all
//     zones, not just the battlefield.
//
// Mortivore's characteristic-defining count (a CDA works in every zone).
// The Adventure half is `cant-wake-up.ts`.

const CDA_TEXT =
  "Cruel Somnophage's power and toughness are each equal to the number of creature cards in all graveyards.";

export default defineCard({
  name: "Cruel Somnophage",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Nightmare"],
  power: 0,
  toughness: 0,
  text: CDA_TEXT,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countInGraveyard: { type: "creature" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: CDA_TEXT,
    },
  ],
  faces: ["Cruel Somnophage", "Can't Wake Up"],
  adventure: true,
});
