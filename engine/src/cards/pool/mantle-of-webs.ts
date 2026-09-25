import { defineCard } from "../define.js";

export default defineCard({
  name: "Mantle of Webs",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+3 and has reach. (It can block creatures with flying.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 3],
      grantKeywords: ["reach"],
      text: "Enchanted creature gets +1/+3 and has reach.",
    },
  ],
});
