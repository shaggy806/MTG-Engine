import { defineCard } from "../define.js";

export default defineCard({
  name: "Marked by Honor",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has vigilance. (Attacking doesn't cause it to tap.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["vigilance"],
      text: "Enchanted creature gets +2/+2 and has vigilance.",
    },
  ],
});
