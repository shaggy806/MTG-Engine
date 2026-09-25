import { defineCard } from "../define.js";

export default defineCard({
  name: "Inspiring Cleric",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 3,
  toughness: 2,
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
