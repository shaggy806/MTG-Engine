import { defineCard } from "../define.js";

export default defineCard({
  name: "Primal Visitation",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +3/+3 and has haste.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, 3],
      grantKeywords: ["haste"],
      text: "Enchanted creature gets +3/+3 and has haste.",
    },
  ],
});
