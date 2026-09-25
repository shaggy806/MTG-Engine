import { defineCard } from "../define.js";

export default defineCard({
  name: "Primordial Pachyderm",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elephant", "Avatar"],
  power: 4,
  toughness: 4,
  keywords: ["reach", "trample"],
  text: "Reach, trample\nWhen this creature enters, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "When this creature enters, you gain 2 life.",
    },
  ],
});
