import { defineCard } from "../define.js";

export default defineCard({
  name: "Chant of the Skifsang",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -13/-0.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-13, 0],
      text: "Enchanted creature gets -13/-0.",
    },
  ],
});
