import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawning Angel",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, you gain 4 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "When this creature enters, you gain 4 life.",
    },
  ],
});
