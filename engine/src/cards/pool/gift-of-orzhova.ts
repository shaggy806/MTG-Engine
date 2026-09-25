import { defineCard } from "../define.js";

export default defineCard({
  name: "Gift of Orzhova",
  manaCost: "{1}{W/B}{W/B}",
  colors: ["W", "B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+1 and has flying and lifelink.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["flying", "lifelink"],
      text: "Enchanted creature gets +1/+1 and has flying and lifelink.",
    },
  ],
});
