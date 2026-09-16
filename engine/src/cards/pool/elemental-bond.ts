import { defineCard } from "../define.js";

export default defineCard({
  name: "Elemental Bond",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever a creature you control with power 3 or greater enters, draw a card.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "creature", controlledBy: "you", power: { op: "gte", n: 3 } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a creature you control with power 3 or greater enters, draw a card.",
    },
  ],
});
