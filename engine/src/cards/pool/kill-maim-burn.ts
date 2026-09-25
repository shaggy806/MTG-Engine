import { defineCard } from "../define.js";

export default defineCard({
  name: "Kill! Maim! Burn!",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text: "Choose one or more —\n• Destroy target artifact.\n• Destroy target creature.\n• Kill! Maim! Burn! deals 3 damage to target player.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target creature.",
        targets: ["creature"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Kill! Maim! Burn! deals 3 damage to target player.",
        targets: ["player"],
        effect: { kind: "damage", amount: 3, target: 0 },
      },
    ],
  },
});
