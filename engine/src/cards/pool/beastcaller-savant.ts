import { defineCard } from "../define.js";

// EDHREC rank 5029.
//
// Rulings:
//   [2015-08-25] Mana produced by Beastcaller Savant can be spent on any part of a creature
//     spell’s total cost, including additional costs (such as kicker costs) and alternative costs
//     (such as dash costs). It can’t be spent to pay the costs of abilities of creatures you
//     control.
//   [2015-08-25] Mana produced by Beastcaller Savant can’t be used to activate an ability or cast
//     an instant or sorcery spell that creates creature tokens.

export default defineCard({
  name: "Beastcaller Savant",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman", "Ally"],
  power: 1,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste\n{T}: Add one mana of any color. Spend this mana only to cast a creature spell.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: { spell: { type: "creature" }, text: "Spend this mana only to cast a creature spell." },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a creature spell.",
    },
  ],
});
