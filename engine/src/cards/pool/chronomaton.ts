import { defineCard } from "../define.js";

export default defineCard({
  name: "Chronomaton",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 1,
  toughness: 1,
  text: "{1}, {T}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Put a +1/+1 counter on this creature.",
    },
  ],
});
