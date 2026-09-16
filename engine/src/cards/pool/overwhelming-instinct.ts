import { defineCard } from "../define.js";

export default defineCard({
  name: "Overwhelming Instinct",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever you attack with three or more creatures, draw a card.",
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 3 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you attack with three or more creatures, draw a card.",
    },
  ],
});
