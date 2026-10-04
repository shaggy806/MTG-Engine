import { defineCard } from "../define.js";

// EDHREC rank 4910.
//
// Rulings:
//   [2007-10-01] The mana can't be spent to activate activated abilities of Elemental sources that
//     aren't on the battlefield. (`abilityOf` reads permanents only.)
//   [2007-10-01] You can use this mana to pay an alternative cost (such as evoke) or additional
//     cost incurred while casting an Elemental spell. It's not limited to just that spell's mana
//     cost.
//   [2007-10-01] The mana can be two mana of the same color, or one mana of each of two different
//     colors. The mana can't be colorless.
//
// Orb of Dragonkind's shape.

const TEXT =
  "{T}: Add two mana in any combination of colors. Spend this mana only to cast Elemental spells or activate abilities of Elementals.";

export default defineCard({
  name: "Smokebraider",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Shaman"],
  power: 1,
  toughness: 1,
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
          text: "Spend this mana only to cast Elemental spells or activate abilities of Elementals.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
