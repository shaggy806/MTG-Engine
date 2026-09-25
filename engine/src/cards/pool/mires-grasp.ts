import { defineCard } from "../define.js";

export default defineCard({
  name: "Mire's Grasp",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -3/-3.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-3, -3],
      text: "Enchanted creature gets -3/-3.",
    },
  ],
});
