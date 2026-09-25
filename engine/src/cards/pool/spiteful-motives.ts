import { defineCard } from "../define.js";

export default defineCard({
  name: "Spiteful Motives",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nEnchant creature\nEnchanted creature gets +3/+0 and has first strike.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, 0],
      grantKeywords: ["first-strike"],
      text: "Enchanted creature gets +3/+0 and has first strike.",
    },
  ],
});
