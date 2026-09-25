import { defineCard } from "../define.js";

export default defineCard({
  name: "Esper Charm",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  types: ["instant"],
  text: "Choose one —\n• Destroy target enchantment.\n• Draw two cards.\n• Target player discards two cards.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      { text: "Draw two cards.", effect: { kind: "draw", amount: 2 } },
      {
        text: "Target player discards two cards.",
        targets: ["player"],
        effect: { kind: "discard", target: 0, amount: 2 },
      },
    ],
  },
});
