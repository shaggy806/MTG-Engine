import { defineCard } from "../define.js";

// EDHREC rank 2562.
//
// Rulings:
//   [2012-05-01] Mana produced by Somberwald Sage can't be spent on noncreature spells that would
//     put creature tokens onto the battlefield.
//   [2012-05-01] Mana produced by Somberwald Sage can be spent on any part of a creature spell's
//     total cost. This includes additional costs (such as kicker) and alternative costs (such as
//     evoke costs).
//   [2012-05-01] Mana produced by Somberwald Sage can't be spent on activated abilities, even ones
//     that put a creature card directly onto the battlefield, such as unearth or ninjutsu.
//
// "Three mana of any one color" is `any-color` × 3 (Lotus Field's shape); the
// spend restriction is Ancient Ziggurat's, with no `abilityOf`.

const MANA_TEXT = "{T}: Add three mana of any one color. Spend this mana only to cast creature spells.";

export default defineCard({
  name: "Somberwald Sage",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 0,
  toughness: 1,
  text: MANA_TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 3,
        spendOnly: {
          spell: { type: "creature" },
          text: "Spend this mana only to cast creature spells.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
