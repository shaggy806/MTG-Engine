import { defineCard } from "../define.js";

export default defineCard({
  name: "Moonrise Cleric",
  manaCost: "{1}{W/B}{W/B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Bat", "Cleric"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever this creature attacks, you gain 1 life.",
    },
  ],
});
