import { defineCard } from "../define.js";

export default defineCard({
  name: "Vigilance",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has vigilance. (Attacking doesn't cause it to tap.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["vigilance"],
      text: "Enchanted creature has vigilance.",
    },
  ],
});
