import { defineCard } from "../define.js";

export default defineCard({
  name: "Zephyr Net",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has defender and flying.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["defender", "flying"],
      text: "Enchanted creature has defender and flying.",
    },
  ],
});
