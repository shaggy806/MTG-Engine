import { defineCard } from "../define.js";

export default defineCard({
  name: "Overgrown Estate",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  types: ["enchantment"],
  text: "Sacrifice a land: You gain 3 life.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "Sacrifice a land: You gain 3 life.",
    },
  ],
});
