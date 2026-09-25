import { defineCard } from "../define.js";

export default defineCard({
  name: "Guul Draz Mucklord",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Crocodile"],
  power: 2,
  toughness: 3,
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
