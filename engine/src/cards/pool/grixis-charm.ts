import { defineCard } from "../define.js";

export default defineCard({
  name: "Grixis Charm",
  manaCost: "{U}{B}{R}",
  colors: ["U", "B", "R"],
  types: ["instant"],
  text: "Choose one —\n• Return target permanent to its owner's hand.\n• Target creature gets -4/-4 until end of turn.\n• Creatures you control get +2/+0 until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Return target permanent to its owner's hand.",
        targets: ["permanent"],
        effect: { kind: "return-to-hand", target: 0 },
      },
      {
        text: "Target creature gets -4/-4 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: -4, toughness: -4, duration: "end-of-turn" },
      },
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
    ],
  },
});
