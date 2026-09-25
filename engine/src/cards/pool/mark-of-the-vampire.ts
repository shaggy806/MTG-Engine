import { defineCard } from "../define.js";

export default defineCard({
  name: "Mark of the Vampire",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has lifelink.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["lifelink"],
      text: "Enchanted creature gets +2/+2 and has lifelink.",
    },
  ],
});
