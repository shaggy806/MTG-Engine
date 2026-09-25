import { defineCard } from "../define.js";

export default defineCard({
  name: "Diplomatic Immunity",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["shroud"],
  text: "Enchant creature\nShroud (A permanent with shroud can't be the target of spells or abilities.)\nEnchanted creature has shroud.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["shroud"],
      text: "Enchanted creature has shroud.",
    },
  ],
});
