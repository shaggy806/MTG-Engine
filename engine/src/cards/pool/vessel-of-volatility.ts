import { defineCard } from "../define.js";

export default defineCard({
  name: "Vessel of Volatility",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{1}{R}, Sacrifice this enchantment: Add {R}{R}{R}{R}.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 4 },
      resolve: null,
      text: "{1}{R}, Sacrifice this enchantment: Add {R}{R}{R}{R}.",
    },
  ],
});
