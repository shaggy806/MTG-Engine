import { defineCard } from "../define.js";

export default defineCard({
  name: "Umezawa's Charm",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one —\n• Target creature gets +2/+2 until end of turn.\n• Target creature gets -1/-1 until end of turn.\n• You gain 2 life.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target creature gets +2/+2 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      },
      {
        text: "Target creature gets -1/-1 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      },
      { text: "You gain 2 life.", effect: { kind: "gain-life", amount: 2 } },
    ],
  },
});
