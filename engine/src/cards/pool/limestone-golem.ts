import { defineCard } from "../define.js";

export default defineCard({
  name: "Limestone Golem",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 4,
  text: "{2}, Sacrifice this creature: Target player draws a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "draw", amount: 1, target: 0 },
      resolve: null,
      text: "{2}, Sacrifice this creature: Target player draws a card.",
    },
  ],
});
