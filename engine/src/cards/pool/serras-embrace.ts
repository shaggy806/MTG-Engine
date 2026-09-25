import { defineCard } from "../define.js";

export default defineCard({
  name: "Serra's Embrace",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has flying and vigilance. (Attacking doesn't cause it to tap.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["flying", "vigilance"],
      text: "Enchanted creature gets +2/+2 and has flying and vigilance.",
    },
  ],
});
