import { defineCard } from "../define.js";

export default defineCard({
  name: "Infectious Host",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, target player loses 2 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 2, target: 0 },
      resolve: null,
      text: "When this creature dies, target player loses 2 life.",
    },
  ],
});
