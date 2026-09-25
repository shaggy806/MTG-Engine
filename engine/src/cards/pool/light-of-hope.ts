import { defineCard } from "../define.js";

export default defineCard({
  name: "Light of Hope",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Choose one —\n• You gain 4 life.\n• Destroy target enchantment.\n• Put a +1/+1 counter on target creature.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: "You gain 4 life.", effect: { kind: "gain-life", amount: 4 } },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Put a +1/+1 counter on target creature.",
        targets: ["creature"],
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
    ],
  },
});
