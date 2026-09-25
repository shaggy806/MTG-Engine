import { defineCard } from "../define.js";

export default defineCard({
  name: "Furious Strength",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has menace. (It can't be blocked except by two or more creatures.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["menace"],
      text: "Enchanted creature gets +2/+2 and has menace.",
    },
  ],
});
