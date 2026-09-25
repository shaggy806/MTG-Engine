import { defineCard } from "../define.js";

export default defineCard({
  name: "Energizer",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Juggernaut"],
  power: 2,
  toughness: 2,
  text: "{2}, {T}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{2}, {T}: Put a +1/+1 counter on this creature.",
    },
  ],
});
