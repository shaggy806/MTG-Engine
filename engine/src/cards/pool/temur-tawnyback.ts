import { defineCard } from "../define.js";

export default defineCard({
  name: "Temur Tawnyback",
  manaCost: "{2/G}{2/U}{2/R}",
  colors: ["U", "R", "G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 3,
  text: "When this creature enters, draw a card, then discard a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "When this creature enters, draw a card, then discard a card.",
    },
  ],
});
