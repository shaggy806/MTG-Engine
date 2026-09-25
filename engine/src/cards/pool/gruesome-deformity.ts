import { defineCard } from "../define.js";

export default defineCard({
  name: "Gruesome Deformity",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has intimidate. (It can't be blocked except by artifact creatures and/or creatures that share a color with it.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["intimidate"],
      text: "Enchanted creature has intimidate.",
    },
  ],
});
