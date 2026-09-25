import { defineCard } from "../define.js";

export default defineCard({
  name: "Madcap Skills",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +3/+0 and has menace.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, 0],
      grantKeywords: ["menace"],
      text: "Enchanted creature gets +3/+0 and has menace.",
    },
  ],
});
