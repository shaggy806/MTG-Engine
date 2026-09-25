import { defineCard } from "../define.js";

export default defineCard({
  name: "Dark Heart of the Wood",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text: "Sacrifice a Forest: You gain 3 life.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Forest" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "Sacrifice a Forest: You gain 3 life.",
    },
  ],
});
