import { defineCard } from "../define.js";

export default defineCard({
  name: "EPF Point Squad",
  manaCost: "{1}{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  text: "Alliance — Whenever another creature you control enters, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Alliance — Whenever another creature you control enters, put a +1/+1 counter on this creature.",
    },
  ],
});
