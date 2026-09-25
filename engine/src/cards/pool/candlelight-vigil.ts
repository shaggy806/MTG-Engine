import { defineCard } from "../define.js";

export default defineCard({
  name: "Candlelight Vigil",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +3/+2 and has vigilance.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, 2],
      grantKeywords: ["vigilance"],
      text: "Enchanted creature gets +3/+2 and has vigilance.",
    },
  ],
});
