import { defineCard } from "../define.js";

export default defineCard({
  name: "Magefire Wings",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+0 and has flying.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["flying"],
      text: "Enchanted creature gets +2/+0 and has flying.",
    },
  ],
});
