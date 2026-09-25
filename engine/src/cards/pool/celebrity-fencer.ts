import { defineCard } from "../define.js";

export default defineCard({
  name: "Celebrity Fencer",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 2,
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
