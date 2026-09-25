import { defineCard } from "../define.js";

export default defineCard({
  name: "Skirmish Rhino",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  types: ["creature"],
  subtypes: ["Rhino"],
  power: 3,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, each opponent loses 2 life and you gain 2 life.",
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
