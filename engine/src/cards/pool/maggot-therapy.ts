import { defineCard } from "../define.js";

export default defineCard({
  name: "Maggot Therapy",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets +2/-2.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, -2],
      text: "Enchanted creature gets +2/-2.",
    },
  ],
});
