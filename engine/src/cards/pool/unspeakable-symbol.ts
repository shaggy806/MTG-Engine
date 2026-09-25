import { defineCard } from "../define.js";

export default defineCard({
  name: "Unspeakable Symbol",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Pay 3 life: Put a +1/+1 counter on target creature.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 3 },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Pay 3 life: Put a +1/+1 counter on target creature.",
    },
  ],
});
