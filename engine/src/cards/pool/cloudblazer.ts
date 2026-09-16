import { defineCard } from "../define.js";

export default defineCard({
  name: "Cloudblazer",
  manaCost: "{3}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen Cloudblazer enters, you gain 2 life and draw two cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 2 },
          { kind: "draw", amount: 2 },
        ],
      },
      resolve: null,
      text: "When Cloudblazer enters, you gain 2 life and draw two cards.",
    },
  ],
});
