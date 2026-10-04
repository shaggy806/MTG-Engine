import { defineCard } from "../define.js";

// EDHREC rank 6039.
//
// Rulings:
//   [2023-09-01] Hopeless Nightmare's first ability causes each opponent to lose 2 life even if
//     some or all of those players were unable to discard a card.

export default defineCard({
  name: "Hopeless Nightmare",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "When this enchantment enters, each opponent discards a card and loses 2 life.\nWhen this enchantment is put into a graveyard from the battlefield, scry 2.\n{2}{B}: Sacrifice this enchantment.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: { kind: "sacrifice-source" },
      resolve: null,
      text: "{2}{B}: Sacrifice this enchantment.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard", target: "each-opponent", amount: 1 },
          { kind: "lose-life", amount: 2, who: "each-opponent" },
        ],
      },
      resolve: null,
      text: "When this enchantment enters, each opponent discards a card and loses 2 life.",
    },
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this enchantment is put into a graveyard from the battlefield, scry 2.",
    },
  ],
});
