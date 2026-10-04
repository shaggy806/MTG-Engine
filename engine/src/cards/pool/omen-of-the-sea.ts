import { defineCard } from "../define.js";

// EDHREC rank 6098.

export default defineCard({
  name: "Omen of the Sea",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nWhen this enchantment enters, scry 2, then draw a card.\n{2}{U}, Sacrifice this enchantment: Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "{2}{U}, Sacrifice this enchantment: Scry 2.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Deliberate's shape.
      effect: { kind: "scry", amount: 2, then: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "When this enchantment enters, scry 2, then draw a card.",
    },
  ],
});
