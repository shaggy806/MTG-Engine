import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunbeam Spellbomb",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{W}, Sacrifice this artifact: You gain 5 life.\n{1}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "{W}, Sacrifice this artifact: You gain 5 life.",
    },
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
