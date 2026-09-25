import { defineCard } from "../define.js";

export default defineCard({
  name: "Immolation",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/-2.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, -2],
      text: "Enchanted creature gets +2/-2.",
    },
  ],
});
