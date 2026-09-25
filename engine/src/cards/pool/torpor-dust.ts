import { defineCard } from "../define.js";

export default defineCard({
  name: "Torpor Dust",
  manaCost: "{2}{U/B}",
  colors: ["U", "B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets -3/-0.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-3, 0],
      text: "Enchanted creature gets -3/-0.",
    },
  ],
});
