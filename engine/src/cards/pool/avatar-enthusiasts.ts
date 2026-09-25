import { defineCard } from "../define.js";

export default defineCard({
  name: "Avatar Enthusiasts",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Peasant", "Ally"],
  power: 2,
  toughness: 2,
  text: "Whenever another Ally you control enters, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Ally" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another Ally you control enters, put a +1/+1 counter on this creature.",
    },
  ],
});
