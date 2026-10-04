import { defineCard } from "../define.js";

// Garruk, Cursed Huntsman's Wolf token.

const TEXT = "When this creature dies, put a loyalty counter on each Garruk you control.";

export default defineCard({
  name: "Wolf Token (Garruk, Cursed Huntsman)",
  art: "88452ed7-1065-41c3-94a6-dc41108c45c1",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "planeswalker", subtype: "Garruk", controlledBy: "you" },
        counter: "loyalty",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
