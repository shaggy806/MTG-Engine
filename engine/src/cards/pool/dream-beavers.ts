import { defineCard } from "../define.js";

export default defineCard({
  name: "Dream Beavers",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Beaver", "Nightmare"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, each opponent loses 1 life and you gain 1 life. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "sequence",
            effects: [
              { kind: "lose-life", amount: 1, who: "each-opponent" },
              { kind: "gain-life", amount: 1 },
            ],
          },
          { kind: "scry", amount: 1 },
        ],
      },
      resolve: null,
      text: "When this creature enters, each opponent loses 1 life and you gain 1 life. Scry 1.",
    },
  ],
});
