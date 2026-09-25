import { defineCard } from "../define.js";

export default defineCard({
  name: "Imposing Visage",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has menace. (It can't be blocked except by two or more creatures.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["menace"],
      text: "Enchanted creature has menace.",
    },
  ],
});
