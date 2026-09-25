import { defineCard } from "../define.js";

export default defineCard({
  name: "Weight of the Underworld",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -3/-2.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-3, -2],
      text: "Enchanted creature gets -3/-2.",
    },
  ],
});
