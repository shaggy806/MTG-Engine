import { defineCard } from "../define.js";

export default defineCard({
  name: "Eternal Warrior",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has vigilance.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["vigilance"],
      text: "Enchanted creature has vigilance.",
    },
  ],
});
