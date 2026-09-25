import { defineCard } from "../define.js";

export default defineCard({
  name: "Hazard of the Dunes",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 4,
  toughness: 4,
  keywords: ["reach", "trample"],
  text: "Reach, trample\nExhaust — {6}{G}: Put three +1/+1 counters on this creature. (Activate each exhaust ability only once.)",
  activated: [
    {
      cost: { mana: "{6}{G}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
      resolve: null,
      text: "Exhaust — {6}{G}: Put three +1/+1 counters on this creature.",
      exhaust: true,
    },
  ],
});
