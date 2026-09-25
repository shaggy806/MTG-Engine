import { defineCard } from "../define.js";

export default defineCard({
  name: "Invoke the Firemind",
  manaCost: "{X}{U}{U}{R}",
  colors: ["U", "R"],
  types: ["sorcery"],
  text: "Choose one —\n• Draw X cards.\n• Invoke the Firemind deals X damage to any target.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: "Draw X cards.", effect: { kind: "draw", amount: "x" } },
      {
        text: "Invoke the Firemind deals X damage to any target.",
        targets: ["any-target"],
        effect: { kind: "damage", amount: "x", target: 0 },
      },
    ],
  },
});
