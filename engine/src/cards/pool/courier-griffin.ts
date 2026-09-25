import { defineCard } from "../define.js";

export default defineCard({
  name: "Courier Griffin",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, you gain 2 life.",
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
