import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Arena",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, you draw a card and you lose 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: null,
      resolve: (ctx) => {
        ctx.draw(ctx.controller, 1);
        ctx.loseLife(ctx.controller, 1);
      },
      text: "At the beginning of your upkeep, draw a card and lose 1 life.",
    },
  ],
});
