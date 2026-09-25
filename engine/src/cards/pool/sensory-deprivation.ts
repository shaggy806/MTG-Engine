import { defineCard } from "../define.js";

export default defineCard({
  name: "Sensory Deprivation",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -3/-0.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-3, 0],
      text: "Enchanted creature gets -3/-0.",
    },
  ],
});
