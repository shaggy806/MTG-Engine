import { defineCard } from "../define.js";

export default defineCard({
  name: "Carnage Altar",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{3}, Sacrifice a creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{3}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}, Sacrifice a creature: Draw a card.",
    },
  ],
});
