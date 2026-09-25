import { defineCard } from "../define.js";

export default defineCard({
  name: "Guardian Automaton",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 3,
  text: "When this creature dies, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When this creature dies, you gain 3 life.",
    },
  ],
});
