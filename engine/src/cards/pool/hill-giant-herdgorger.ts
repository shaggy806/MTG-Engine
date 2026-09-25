import { defineCard } from "../define.js";

export default defineCard({
  name: "Hill Giant Herdgorger",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 7,
  toughness: 6,
  text: "When this creature enters, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When this creature enters, you gain 3 life.",
    },
  ],
});
