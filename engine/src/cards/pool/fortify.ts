import { defineCard } from "../define.js";

export default defineCard({
  name: "Fortify",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Choose one —\n• Creatures you control get +2/+0 until end of turn.\n• Creatures you control get +0/+2 until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Creatures you control get +2/+0 until end of turn.",
        effect: {
          kind: "modify-pt-all",
          filter: { type: "creature", controlledBy: "you" },
          power: 2,
          toughness: 0,
          duration: "end-of-turn",
        },
      },
      {
        text: "Creatures you control get +0/+2 until end of turn.",
        effect: {
          kind: "modify-pt-all",
          filter: { type: "creature", controlledBy: "you" },
          power: 0,
          toughness: 2,
          duration: "end-of-turn",
        },
      },
    ],
  },
});
