import { defineCard } from "../define.js";

export default defineCard({
  name: "Quicksilver Fisher",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Drake"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, draw a card, then discard a card.",
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
