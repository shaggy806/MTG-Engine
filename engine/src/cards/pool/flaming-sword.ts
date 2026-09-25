import { defineCard } from "../define.js";

export default defineCard({
  name: "Flaming Sword",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets +1/+0 and has first strike.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["first-strike"],
      text: "Enchanted creature gets +1/+0 and has first strike.",
    },
  ],
});
