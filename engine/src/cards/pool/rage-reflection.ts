import { defineCard } from "../define.js";

export default defineCard({
  name: "Rage Reflection",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Creatures you control have double strike.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["double-strike"],
      text: "Creatures you control have double strike.",
    },
  ],
});
