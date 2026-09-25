import { defineCard } from "../define.js";

export default defineCard({
  name: "Clinging Darkness",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -4/-1.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-4, -1],
      text: "Enchanted creature gets -4/-1.",
    },
  ],
});
