import { defineCard } from "../define.js";

export default defineCard({
  name: "Prodigious Growth",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +7/+7 and has trample.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [7, 7],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +7/+7 and has trample.",
    },
  ],
});
