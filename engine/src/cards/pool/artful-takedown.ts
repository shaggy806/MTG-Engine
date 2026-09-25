import { defineCard } from "../define.js";

export default defineCard({
  name: "Artful Takedown",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  types: ["instant"],
  text: "Choose one or both —\n• Tap target creature.\n• Target creature gets -2/-4 until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Tap target creature.",
        targets: ["creature"],
        effect: { kind: "tap", target: 0 },
      },
      {
        text: "Target creature gets -2/-4 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: -2, toughness: -4, duration: "end-of-turn" },
      },
    ],
  },
});
