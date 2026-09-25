import { defineCard } from "../define.js";

export default defineCard({
  name: "Chrome Cat",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Cat"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, scry 1.",
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
