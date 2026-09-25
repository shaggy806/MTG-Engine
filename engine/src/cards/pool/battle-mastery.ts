import { defineCard } from "../define.js";

export default defineCard({
  name: "Battle Mastery",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has double strike. (It deals both first-strike and regular combat damage.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["double-strike"],
      text: "Enchanted creature has double strike.",
    },
  ],
});
