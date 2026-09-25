import { defineCard } from "../define.js";

export default defineCard({
  name: "Shire Scarecrow",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\n{1}: Add one mana of any color. Activate only once each turn.",
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
