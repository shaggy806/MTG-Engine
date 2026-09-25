import { defineCard } from "../define.js";

export default defineCard({
  name: "Salvaged Manaworker",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 3,
  text: "{1}: Add one mana of any color. Activate only once each turn.",
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
