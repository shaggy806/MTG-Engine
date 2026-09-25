import { defineCard } from "../define.js";

export default defineCard({
  name: "Rot Shambler",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 1,
  toughness: 1,
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
