import { defineCard } from "../define.js";

export default defineCard({
  name: "Greenbelt Guardian",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Ranger"],
  power: 2,
  toughness: 2,
  text: "{G}: Target creature gains trample until end of turn.\nExhaust — {3}{G}: Put three +1/+1 counters on this creature. (Activate each exhaust ability only once.)",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{G}: Target creature gains trample until end of turn.",
    },
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
      resolve: null,
      text: "Exhaust — {3}{G}: Put three +1/+1 counters on this creature.",
      exhaust: true,
    },
  ],
});
