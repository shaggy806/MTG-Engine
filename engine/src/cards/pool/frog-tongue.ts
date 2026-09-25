import { defineCard } from "../define.js";

export default defineCard({
  name: "Frog Tongue",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, draw a card.\nEnchanted creature has reach. (It can block creatures with flying.)",
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
      grantKeywords: ["reach"],
      text: "Enchanted creature has reach.",
    },
  ],
});
