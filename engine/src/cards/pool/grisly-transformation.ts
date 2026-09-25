import { defineCard } from "../define.js";

export default defineCard({
  name: "Grisly Transformation",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, draw a card.\nEnchanted creature has intimidate. (It can't be blocked except by artifact creatures and/or creatures that share a color with it.)",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this Aura enters, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["intimidate"],
      text: "Enchanted creature has intimidate.",
    },
  ],
});
