import { defineCard } from "../define.js";

export default defineCard({
  name: "Volcanic Strength",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has mountainwalk. (It can't be blocked as long as defending player controls a Mountain.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["mountainwalk"],
      text: "Enchanted creature gets +2/+2 and has mountainwalk.",
    },
  ],
});
