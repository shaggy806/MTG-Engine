import { defineCard } from "../define.js";

export default defineCard({
  name: "Owlbear",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bird", "Bear"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nKeen Senses — When this creature enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Keen Senses — When this creature enters, draw a card.",
    },
  ],
});
