import { defineCard } from "../define.js";

export default defineCard({
  name: "Defensive Stance",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -1/+1.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-1, 1],
      text: "Enchanted creature gets -1/+1.",
    },
  ],
});
