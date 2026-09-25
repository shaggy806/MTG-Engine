import { defineCard } from "../define.js";

export default defineCard({
  name: "Enatu Golem",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 5,
  text: "When this creature dies, you gain 4 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "When this creature dies, you gain 4 life.",
    },
  ],
});
