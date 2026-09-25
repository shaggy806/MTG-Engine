import { defineCard } from "../define.js";

export default defineCard({
  name: "Shimmering Wings",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature (Target a creature as you cast this. This card enters attached to that creature.)\nEnchanted creature has flying. (It can't be blocked except by creatures with flying or reach.)\n{U}: Return this Aura to its owner's hand.",
  targets: ["creature"],
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{U}: Return this Aura to its owner's hand.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["flying"],
      text: "Enchanted creature has flying.",
    },
  ],
});
