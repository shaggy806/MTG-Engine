import { defineCard } from "../define.js";

export default defineCard({
  name: "Twisted Experiment",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +3/-1.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, -1],
      text: "Enchanted creature gets +3/-1.",
    },
  ],
});
