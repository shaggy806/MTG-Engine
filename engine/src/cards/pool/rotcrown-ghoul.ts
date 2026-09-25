import { defineCard } from "../define.js";

export default defineCard({
  name: "Rotcrown Ghoul",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 3,
  text: "When this creature dies, target player mills five cards.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 5 },
      resolve: null,
      text: "When this creature dies, target player mills five cards.",
    },
  ],
});
