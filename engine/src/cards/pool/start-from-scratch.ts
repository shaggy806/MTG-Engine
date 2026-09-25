import { defineCard } from "../define.js";

export default defineCard({
  name: "Start from Scratch",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Choose one —\n• Start from Scratch deals 1 damage to any target.\n• Destroy target artifact.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Start from Scratch deals 1 damage to any target.",
        targets: ["any-target"],
        effect: { kind: "damage", amount: 1, target: 0 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
