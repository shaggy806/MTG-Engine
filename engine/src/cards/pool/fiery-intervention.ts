import { defineCard } from "../define.js";

export default defineCard({
  name: "Fiery Intervention",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Choose one —\n• Fiery Intervention deals 5 damage to target creature.\n• Destroy target artifact.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Fiery Intervention deals 5 damage to target creature.",
        targets: ["creature"],
        effect: { kind: "damage", amount: 5, target: 0 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
