import { defineCard } from "../define.js";

export default defineCard({
  name: "Boon of Emrakul",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +3/-3.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, -3],
      text: "Enchanted creature gets +3/-3.",
    },
  ],
});
