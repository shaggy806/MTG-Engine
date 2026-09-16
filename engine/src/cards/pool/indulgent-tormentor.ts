import { defineCard } from "../define.js";

export default defineCard({
  name: "Indulgent Tormentor",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 5,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "At the beginning of your upkeep, draw a card unless target opponent sacrifices a creature of their choice or pays 3 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["opponent"],
      effect: {
        kind: "unless",
        chooser: 0,
        options: [
          { sacrifice: { type: "creature" }, text: "Sacrifice a creature" },
          { payLife: 3, text: "Pay 3 life" },
        ],
        otherwise: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "At the beginning of your upkeep, draw a card unless target opponent sacrifices a creature of their choice or pays 3 life.",
    },
  ],
});
