import { defineCard } from "../define.js";

export default defineCard({
  name: "Fateful Discovery",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever an artifact you control enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever an artifact you control enters, draw a card.",
    },
  ],
});
