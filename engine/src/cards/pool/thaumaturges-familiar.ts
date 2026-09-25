import { defineCard } from "../define.js";

export default defineCard({
  name: "Thaumaturge's Familiar",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, scry 1.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When this creature enters, scry 1.",
    },
  ],
});
