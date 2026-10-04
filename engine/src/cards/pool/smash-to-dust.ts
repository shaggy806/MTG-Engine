import { defineCard } from "../define.js";

// EDHREC rank 5794.

export default defineCard({
  name: "Smash to Dust",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Choose one —\n" +
    "• Destroy target artifact.\n" +
    "• Destroy target creature with defender.\n" +
    "• Smash to Dust deals 1 damage to each creature your opponents control.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target creature with defender.",
        targets: [{ kind: "permanent", filter: { type: "creature", keyword: "defender" } }],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Smash to Dust deals 1 damage to each creature your opponents control.",
        targets: [],
        effect: { kind: "damage-all", amount: 1, filter: { type: "creature", controlledBy: "opponent" } },
      },
    ],
  },
});
