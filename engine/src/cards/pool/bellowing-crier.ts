import { defineCard } from "../define.js";

export default defineCard({
  name: "Bellowing Crier",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Frog", "Advisor"],
  power: 2,
  toughness: 1,
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
