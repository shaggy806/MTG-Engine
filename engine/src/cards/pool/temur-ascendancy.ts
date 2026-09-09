import { defineCard } from "../define.js";

export default defineCard({
  name: "Temur Ascendancy",
  manaCost: "{G}{U}{R}",
  colors: ["G", "U", "R"],
  types: ["enchantment"],
  text:
    "Creatures you control have haste.\n" +
    "Whenever a creature with power 4 or greater enters the battlefield under your control, draw a card.",
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
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a creature with power 4 or greater enters the battlefield under your control, draw a card.",
    },
  ],
});
