import { defineCard } from "../define.js";

export default defineCard({
  name: "Icewind Elemental",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 4,
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
