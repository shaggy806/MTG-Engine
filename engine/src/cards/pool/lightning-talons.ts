import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Talons",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +3/+0 and has first strike. (It deals combat damage before creatures without first strike.)",
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
