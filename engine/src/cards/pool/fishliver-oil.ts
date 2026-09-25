import { defineCard } from "../define.js";

export default defineCard({
  name: "Fishliver Oil",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature (Target a creature as you cast this. This card enters attached to that creature.)\nEnchanted creature has islandwalk. (It can't be blocked as long as defending player controls an Island.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["islandwalk"],
      text: "Enchanted creature has islandwalk.",
    },
  ],
});
