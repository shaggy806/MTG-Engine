import { defineCard } from "../define.js";

export default defineCard({
  name: "Siege Rhino",
  manaCost: "{1}{W}{B}{G}",
  colors: ["W", "B", "G"],
  types: ["creature"],
  subtypes: ["Rhino"],
  power: 4,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, each opponent loses 3 life and you gain 3 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 3, who: "each-opponent" },
          { kind: "gain-life", amount: 3 },
        ],
      },
      resolve: null,
      text: "When this creature enters, each opponent loses 3 life and you gain 3 life.",
    },
  ],
});
