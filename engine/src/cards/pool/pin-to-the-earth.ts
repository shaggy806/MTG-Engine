import { defineCard } from "../define.js";

export default defineCard({
  name: "Pin to the Earth",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -6/-0.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-6, 0],
      text: "Enchanted creature gets -6/-0.",
    },
  ],
});
