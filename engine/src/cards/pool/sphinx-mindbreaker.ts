import { defineCard } from "../define.js";

export default defineCard({
  name: "Sphinx Mindbreaker",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, each opponent mills ten cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "each-opponent", amount: 10 },
      resolve: null,
      text: "When this creature enters, each opponent mills ten cards.",
    },
  ],
});
