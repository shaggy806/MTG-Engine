import { defineCard } from "../define.js";

export default defineCard({
  name: "Scarecrow Guide",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 2,
  toughness: 1,
  keywords: ["reach"],
  text: "Reach\n{1}: Add one mana of any color. Activate only once each turn.",
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
