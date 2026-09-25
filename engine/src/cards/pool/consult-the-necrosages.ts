import { defineCard } from "../define.js";

export default defineCard({
  name: "Consult the Necrosages",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  types: ["sorcery"],
  text: "Choose one —\n• Target player draws two cards.\n• Target player discards two cards.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target player draws two cards.",
        targets: ["player"],
        effect: { kind: "draw", amount: 2, target: 0 },
      },
      {
        text: "Target player discards two cards.",
        targets: ["player"],
        effect: { kind: "discard", target: 0, amount: 2 },
      },
    ],
  },
});
