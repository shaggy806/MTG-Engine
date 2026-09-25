import { defineCard } from "../define.js";

export default defineCard({
  name: "Generous Stray",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this creature enters, draw a card.",
    },
  ],
});
