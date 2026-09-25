import { defineCard } from "../define.js";

export default defineCard({
  name: "Village Cannibals",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 2,
  text: "Whenever another Human creature dies, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { subtype: "Human", type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another Human creature dies, put a +1/+1 counter on this creature.",
    },
  ],
});
