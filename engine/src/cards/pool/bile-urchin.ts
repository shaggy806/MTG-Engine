import { defineCard } from "../define.js";

export default defineCard({
  name: "Bile Urchin",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Target player loses 1 life.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "Sacrifice this creature: Target player loses 1 life.",
    },
  ],
});
