import { defineCard } from "../define.js";

export default defineCard({
  name: "Bulwark Giant",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Giant", "Soldier"],
  power: 3,
  toughness: 6,
  text: "When this creature enters, you gain 5 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "When this creature enters, you gain 5 life.",
    },
  ],
});
