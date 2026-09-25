import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Vault",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}, Sacrifice a creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, {T}, Sacrifice a creature: Draw a card.",
    },
  ],
});
