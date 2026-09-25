import { defineCard } from "../define.js";

export default defineCard({
  name: "Pond Prophet",
  manaCost: "{G/U}{G/U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Frog", "Advisor"],
  power: 1,
  toughness: 1,
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
