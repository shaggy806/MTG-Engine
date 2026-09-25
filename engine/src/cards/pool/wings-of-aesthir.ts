import { defineCard } from "../define.js";

export default defineCard({
  name: "Wings of Aesthir",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+0 and has flying and first strike.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["flying", "first-strike"],
      text: "Enchanted creature gets +1/+0 and has flying and first strike.",
    },
  ],
});
