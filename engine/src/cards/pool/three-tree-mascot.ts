import { defineCard } from "../define.js";

// EDHREC rank 4211.

export default defineCard({
  name: "Three Tree Mascot",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Shapeshifter"],
  power: 2,
  toughness: 1,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)\n{1}: Add one mana of any color. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}: Add one mana of any color. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
