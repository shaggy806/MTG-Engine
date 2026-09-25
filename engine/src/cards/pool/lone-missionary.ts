import { defineCard } from "../define.js";

export default defineCard({
  name: "Lone Missionary",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Monk"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, you gain 4 life.",
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
