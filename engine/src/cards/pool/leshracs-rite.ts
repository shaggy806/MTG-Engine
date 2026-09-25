import { defineCard } from "../define.js";

export default defineCard({
  name: "Leshrac's Rite",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has swampwalk. (It can't be blocked as long as defending player controls a Swamp.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["swampwalk"],
      text: "Enchanted creature has swampwalk.",
    },
  ],
});
