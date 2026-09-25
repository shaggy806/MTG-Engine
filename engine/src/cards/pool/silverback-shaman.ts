import { defineCard } from "../define.js";

export default defineCard({
  name: "Silverback Shaman",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ape", "Shaman"],
  power: 5,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nWhen this creature dies, draw a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this creature dies, draw a card.",
    },
  ],
});
