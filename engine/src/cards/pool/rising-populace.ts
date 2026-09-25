import { defineCard } from "../define.js";

export default defineCard({
  name: "Rising Populace",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 2,
  text: "Whenever another creature or planeswalker you control dies, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { typesAnyOf: ["creature", "planeswalker"] },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another creature or planeswalker you control dies, put a +1/+1 counter on this creature.",
    },
  ],
});
