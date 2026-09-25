import { defineCard } from "../define.js";

export default defineCard({
  name: "Pelakka Wurm",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 7,
  toughness: 7,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)\nWhen this creature enters, you gain 7 life.\nWhen this creature dies, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 7 },
      resolve: null,
      text: "When this creature enters, you gain 7 life.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this creature dies, draw a card.",
    },
  ],
});
