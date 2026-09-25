import { defineCard } from "../define.js";

export default defineCard({
  name: "Sledding Otter-Penguin",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Otter", "Bird"],
  power: 2,
  toughness: 3,
  text: "{3}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{3}: Put a +1/+1 counter on this creature.",
    },
  ],
});
