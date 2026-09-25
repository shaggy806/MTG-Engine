import { defineCard } from "../define.js";

export default defineCard({
  name: "Burrowing",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has mountainwalk. (It can't be blocked as long as defending player controls a Mountain.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["mountainwalk"],
      text: "Enchanted creature has mountainwalk.",
    },
  ],
});
