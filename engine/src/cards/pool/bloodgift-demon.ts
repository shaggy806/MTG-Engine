import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodgift Demon",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, target player draws a card and loses 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["player"],
      // Any player, including yourself — the usual line is to point it at
      // yourself and eat the life loss.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, target: 0 },
          { kind: "lose-life", amount: 1, target: 0 },
        ],
      },
      resolve: null,
      text: "At the beginning of your upkeep, target player draws a card and loses 1 life.",
    },
  ],
});
