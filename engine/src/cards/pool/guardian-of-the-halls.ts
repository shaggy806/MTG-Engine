import { defineCard } from "../define.js";

export default defineCard({
  name: "Guardian of the Halls",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample\n{5}{G}{G}: Put three +1/+1 counters on this creature.",
  activated: [
    {
      cost: { mana: "{5}{G}{G}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
      resolve: null,
      text: "{5}{G}{G}: Put three +1/+1 counters on this creature.",
    },
  ],
});
