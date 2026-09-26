import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent loses life, that player mills that many cards. (Damage causes loss of life.)";

export default defineCard({
  name: "Mindcrank",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "loses-life", who: "opponent" },
      targets: [],
      effect: { kind: "mill", target: "trigger-player", amount: { triggerValue: true } },
      resolve: null,
      text: TEXT,
    },
  ],
});
