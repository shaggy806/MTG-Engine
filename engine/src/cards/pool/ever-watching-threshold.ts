import { defineCard } from "../define.js";

export default defineCard({
  name: "Ever-Watching Threshold",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text:
    "Whenever an opponent attacks, if they attacked you and/or a planeswalker " +
    "you control, draw a card.",
  triggered: [
    {
      // `attack-with`, not `attacks`: the card draws **one** card per attack,
      // and an `attacks` trigger fires once per attacking creature. `atLeast:
      // 1` with `attackingYou` is "they attacked you with at least one".
      trigger: { on: "attack-with", who: "opponent", atLeast: 1, attackingYou: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text:
        "Whenever an opponent attacks, if they attacked you and/or a planeswalker " +
        "you control, draw a card.",
    },
  ],
});
