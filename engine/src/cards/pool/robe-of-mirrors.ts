import { defineCard } from "../define.js";

export default defineCard({
  name: "Robe of Mirrors",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature (Target a creature as you cast this. This card enters attached to that creature.)\nEnchanted creature has shroud. (It can't be the target of spells or abilities.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["shroud"],
      text: "Enchanted creature has shroud.",
    },
  ],
});
