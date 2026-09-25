import { defineCard } from "../define.js";

export default defineCard({
  name: "Greel's Caress",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets -3/-0.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-3, 0],
      text: "Enchanted creature gets -3/-0.",
    },
  ],
});
