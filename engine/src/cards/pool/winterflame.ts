import { defineCard } from "../define.js";

export default defineCard({
  name: "Winterflame",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: "Choose one or both —\n• Tap target creature.\n• Winterflame deals 2 damage to target creature.",
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
        text: "Winterflame deals 2 damage to target creature.",
        targets: ["creature"],
        effect: { kind: "damage", amount: 2, target: 0 },
      },
    ],
  },
});
