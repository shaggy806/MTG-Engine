import { defineCard } from "../define.js";

export default defineCard({
  name: "Null Elemental Blast",
  manaCost: "{C}",
  types: ["instant"],
  text: "Choose one —\n• Counter target multicolored spell.\n• Destroy target multicolored permanent.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Counter target multicolored spell.",
        targets: [{ kind: "spell", filter: { multicolored: true } }],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "Destroy target multicolored permanent.",
        targets: [{ kind: "permanent", filter: { multicolored: true } }],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
