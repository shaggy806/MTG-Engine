import { defineCard } from "../define.js";

export default defineCard({
  name: "Jungle Barrier",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Plant", "Wall"],
  power: 2,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\nWhen this creature enters, draw a card.",
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
