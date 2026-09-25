import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Spawn",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 3,
  text: "When this creature enters, each opponent loses 2 life and you gain 2 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: "When this creature enters, each opponent loses 2 life and you gain 2 life.",
    },
  ],
});
