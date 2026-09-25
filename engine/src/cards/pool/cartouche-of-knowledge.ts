import { defineCard } from "../define.js";

export default defineCard({
  name: "Cartouche of Knowledge",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura", "Cartouche"],
  text: "Enchant creature you control\nWhen this Aura enters, draw a card.\nEnchanted creature gets +1/+1 and has flying.",
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
      grantPt: [1, 1],
      grantKeywords: ["flying"],
      text: "Enchanted creature gets +1/+1 and has flying.",
    },
  ],
});
