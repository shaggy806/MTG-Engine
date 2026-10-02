import { defineCard } from "../define.js";

// The draw is a "may" (Oracle text): the controller can decline it, which
// matters with a library running low.
const DRAW_TEXT = "Whenever a creature you control with power 4 or greater enters, you may draw a card.";

export default defineCard({
  name: "Temur Ascendancy",
  manaCost: "{G}{U}{R}",
  colors: ["G", "U", "R"],
  types: ["enchantment"],
  text: `Creatures you control have haste.\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
