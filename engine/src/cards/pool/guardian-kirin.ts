import { defineCard } from "../define.js";

export default defineCard({
  name: "Guardian Kirin",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kirin"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever another creature you control dies, put a +1/+1 counter on this creature.",
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
