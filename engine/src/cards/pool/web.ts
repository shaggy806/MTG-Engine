import { defineCard } from "../define.js";

export default defineCard({
  name: "Web",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature (Target a creature as you cast this. This card enters attached to that creature.)\nEnchanted creature gets +0/+2 and has reach. (It can block creatures with flying.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [0, 2],
      grantKeywords: ["reach"],
      text: "Enchanted creature gets +0/+2 and has reach.",
    },
  ],
});
