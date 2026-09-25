import { defineCard } from "../define.js";

export default defineCard({
  name: "Deranged Outcast",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  text: "{1}{G}, Sacrifice a Human: Put two +1/+1 counters on target creature.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: { filter: { subtype: "Human" } } },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "{1}{G}, Sacrifice a Human: Put two +1/+1 counters on target creature.",
    },
  ],
});
