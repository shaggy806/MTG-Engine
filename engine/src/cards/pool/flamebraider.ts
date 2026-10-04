import { defineCard } from "../define.js";

// EDHREC rank 5471.
//
// Rulings:
//   [2025-11-17] "Elemental sources" include any objects with the creature type Elemental. For
//     example, you could spend the mana to activate the ability of an Elemental permanent you
//     control or an Elemental card in your hand or graveyard.

const TEXT =
  "{T}: Add two mana in any combination of colors. Spend this mana only to cast Elemental spells or activate abilities of Elemental sources.";

export default defineCard({
  name: "Flamebraider",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Bard"],
  power: 2,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"] },
        amount: 2,
        spendOnly: {
          spell: { subtype: "Elemental" },
          abilityOf: { subtype: "Elemental" },
          // "Elemental sources" — a card in a hand or graveyard too (the ruling).
          abilityOfAnyZone: true,
          text: "Spend this mana only to cast Elemental spells or activate abilities of Elemental sources.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
