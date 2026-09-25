import { defineCard } from "../define.js";

export default defineCard({
  name: "Mythic Proportions",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +8/+8 and has trample.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [8, 8],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +8/+8 and has trample.",
    },
  ],
});
