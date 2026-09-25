import { defineCard } from "../define.js";

export default defineCard({
  name: "Nimbus Wings",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+2 and has flying.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 2],
      grantKeywords: ["flying"],
      text: "Enchanted creature gets +1/+2 and has flying.",
    },
  ],
});
