import { defineCard } from "../define.js";

export default defineCard({
  name: "Sparring Construct",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 1,
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
