import { defineCard } from "../define.js";

export default defineCard({
  name: "Forsaken Drifters",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 4,
  toughness: 2,
  text: "When this creature dies, mill four cards.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 4 },
      resolve: null,
      text: "When this creature dies, mill four cards.",
    },
  ],
});
