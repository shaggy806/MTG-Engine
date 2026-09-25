import { defineCard } from "../define.js";

export default defineCard({
  name: "Feebleness",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets -2/-1.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-2, -1],
      text: "Enchanted creature gets -2/-1.",
    },
  ],
});
