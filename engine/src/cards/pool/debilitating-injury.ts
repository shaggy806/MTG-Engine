import { defineCard } from "../define.js";

export default defineCard({
  name: "Debilitating Injury",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -2/-2.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-2, -2],
      text: "Enchanted creature gets -2/-2.",
    },
  ],
});
