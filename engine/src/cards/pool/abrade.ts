import { defineCard } from "../define.js";

// Both modes target, so this is a cast-time `castModal`, not a resolution-time
// `modal` effect (AUTHORING §6).
export default defineCard({
  name: "Abrade",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Abrade deals 3 damage to target creature.\n" +
    "• Destroy target artifact.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Abrade deals 3 damage to target creature.",
        targets: ["creature"],
        effect: { kind: "damage", amount: 3, target: 0 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
