import { defineCard } from "../define.js";

export default defineCard({
  name: "Swashbuckling",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has haste.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["haste"],
      text: "Enchanted creature gets +2/+2 and has haste.",
    },
  ],
});
