import { defineCard } from "../define.js";

export default defineCard({
  name: "Frenzied Rage",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+1 and has menace. (It can't be blocked except by two or more creatures.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 1],
      grantKeywords: ["menace"],
      text: "Enchanted creature gets +2/+1 and has menace.",
    },
  ],
});
