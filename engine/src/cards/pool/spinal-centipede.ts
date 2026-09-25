import { defineCard } from "../define.js";

export default defineCard({
  name: "Spinal Centipede",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 3,
  toughness: 2,
  text: "When this creature dies, put a +1/+1 counter on target creature you control.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "When this creature dies, put a +1/+1 counter on target creature you control.",
    },
  ],
});
