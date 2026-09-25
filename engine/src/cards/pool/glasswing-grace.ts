import { defineCard } from "../define.js";

export default defineCard({
  name: "Glasswing Grace",
  manaCost: "{3}{W/B}{W/B}",
  colors: ["W", "B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has flying and lifelink.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["flying", "lifelink"],
      text: "Enchanted creature gets +2/+2 and has flying and lifelink.",
    },
  ],
  faces: ["Glasswing Grace", "Age-Graced Chapel"],
});
