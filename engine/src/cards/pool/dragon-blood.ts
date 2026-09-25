import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon Blood",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: Put a +1/+1 counter on target creature.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{3}, {T}: Put a +1/+1 counter on target creature.",
    },
  ],
});
