import { defineCard } from "../define.js";

const TEXT =
  "Whenever one or more creatures you control with mana value 3 or less enter, draw a card. This ability " +
  "triggers only once each turn.";

// "Once each turn" makes "one or more" exact: the first of a batch triggers
// it and the rest can't.
export default defineCard({
  name: "Tocasia's Welcome",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      oncePerTurn: true,
      text: TEXT,
    },
  ],
});
