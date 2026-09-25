import { defineCard } from "../define.js";

export default defineCard({
  name: "Fear",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature (Target a creature as you cast this. This card enters attached to that creature.)\nEnchanted creature has fear. (It can't be blocked except by artifact creatures and/or black creatures.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["fear"],
      text: "Enchanted creature has fear.",
    },
  ],
});
