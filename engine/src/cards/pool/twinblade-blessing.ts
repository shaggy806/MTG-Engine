import { defineCard } from "../define.js";

export default defineCard({
  name: "Twinblade Blessing",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nEnchant creature\nEnchanted creature has double strike. (It deals both first-strike and regular combat damage.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["double-strike"],
      text: "Enchanted creature has double strike.",
    },
  ],
});
