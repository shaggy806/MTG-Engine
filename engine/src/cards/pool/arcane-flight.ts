import { defineCard } from "../define.js";

export default defineCard({
  name: "Arcane Flight",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+1 and has flying.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["flying"],
      text: "Enchanted creature gets +1/+1 and has flying.",
    },
  ],
});
