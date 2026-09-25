import { defineCard } from "../define.js";

export default defineCard({
  name: "Dedicated Martyr",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{W}, Sacrifice this creature: You gain 3 life.",
  activated: [
    {
      cost: { mana: "{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "{W}, Sacrifice this creature: You gain 3 life.",
    },
  ],
});
