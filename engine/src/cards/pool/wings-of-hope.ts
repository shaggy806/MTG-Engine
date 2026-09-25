import { defineCard } from "../define.js";

export default defineCard({
  name: "Wings of Hope",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+3 and has flying.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 3],
      grantKeywords: ["flying"],
      text: "Enchanted creature gets +1/+3 and has flying.",
    },
  ],
});
