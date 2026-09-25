import { defineCard } from "../define.js";

export default defineCard({
  name: "Setessan Training",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature you control\nWhen this Aura enters, draw a card.\nEnchanted creature gets +1/+0 and has trample. (It can deal excess combat damage to the player or planeswalker it's attacking.)",
  targets: ["creature-you-control"],
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
      grantPt: [1, 0],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +1/+0 and has trample.",
    },
  ],
});
