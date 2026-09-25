import { defineCard } from "../define.js";

export default defineCard({
  name: "Herald of Faith",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever this creature attacks, you gain 2 life.",
    },
  ],
});
