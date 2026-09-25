import { defineCard } from "../define.js";

export default defineCard({
  name: "Epic Proportions",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets +5/+5 and has trample.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [5, 5],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +5/+5 and has trample.",
    },
  ],
});
