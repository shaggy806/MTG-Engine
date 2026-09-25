import { defineCard } from "../define.js";

export default defineCard({
  name: "Infernal Tribute",
  manaCost: "{B}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "{2}, Sacrifice a nontoken permanent: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: { filter: { token: false } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice a nontoken permanent: Draw a card.",
    },
  ],
});
