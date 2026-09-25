import { defineCard } from "../define.js";

export default defineCard({
  name: "Guard Duty",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has defender.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["defender"],
      text: "Enchanted creature has defender.",
    },
  ],
});
