import { defineCard } from "../define.js";

export default defineCard({
  name: "Gavony Unhallowed",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 4,
  text: "Whenever another creature you control dies, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control dies, put a +1/+1 counter on this creature.",
    },
  ],
});
