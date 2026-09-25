import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant Spectacle",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+1 and has menace.",
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
