import { defineCard } from "../define.js";

export default defineCard({
  name: "Enfeeblement",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature (Target a creature as you cast this. This card enters attached to that creature.)\nEnchanted creature gets -2/-2.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-2, -2],
      text: "Enchanted creature gets -2/-2.",
    },
  ],
});
