import { defineCard } from "../define.js";

export default defineCard({
  name: "Grasping Longneck",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Horror"],
  power: 4,
  toughness: 2,
  keywords: ["reach"],
  text: "Reach\nWhen this creature dies, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "When this creature dies, you gain 2 life.",
    },
  ],
});
