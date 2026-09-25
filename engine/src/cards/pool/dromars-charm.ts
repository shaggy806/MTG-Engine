import { defineCard } from "../define.js";

export default defineCard({
  name: "Dromar's Charm",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  types: ["instant"],
  text: "Choose one —\n• You gain 5 life.\n• Counter target spell.\n• Target creature gets -2/-2 until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: "You gain 5 life.", effect: { kind: "gain-life", amount: 5 } },
      {
        text: "Counter target spell.",
        targets: ["spell"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "Target creature gets -2/-2 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      },
    ],
  },
});
