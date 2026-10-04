import { defineCard } from "../define.js";

// EDHREC rank 2874.
//
// Rulings:
//   [2023-09-01] Mocking Sprite's last ability can't reduce the amount of colored mana you pay for
//     a spell. It reduces only the generic mana component of that cost.

export default defineCard({
  name: "Mocking Sprite",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nInstant and sorcery spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: "Instant and sorcery spells you cast cost {1} less to cast.",
    },
  ],
});
