import { defineCard } from "../define.js";

// EDHREC rank 2730.
//
// The mana is Ancient Ziggurat's `spendOnly`, narrowed to a spell with any of
// the three creature types (Giada's shape, widened to three).
const TEXT = "{T}, Sacrifice another creature: Add {B}{B}{B}. Spend this mana only to cast Vampire, Cleric, and/or Demon spells.";

export default defineCard({
  name: "Master of Dark Rites",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "B",
        amount: 3,
        spendOnly: {
          spell: { subtypes: ["Vampire", "Cleric", "Demon"] },
          text: "Spend this mana only to cast Vampire, Cleric, and/or Demon spells.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
