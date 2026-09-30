import { defineCard } from "../define.js";

export default defineCard({
  name: "Split Up",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Choose one —\n• Destroy all tapped creatures.\n• Destroy all untapped creatures.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy all tapped creatures.",
        targets: [],
        effect: { kind: "destroy-all", filter: { type: "creature", tapped: true } },
      },
      {
        text: "Destroy all untapped creatures.",
        targets: [],
        effect: { kind: "destroy-all", filter: { type: "creature", tapped: false } },
      },
    ],
  },
});
