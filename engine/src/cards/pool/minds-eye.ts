import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent draws a card, you may pay {1}. If you do, draw a card.";

export default defineCard({
  name: "Mind's Eye",
  manaCost: "{5}",
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: { kind: "may", prompt: "Pay {1} to draw a card?", cost: "{1}", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
