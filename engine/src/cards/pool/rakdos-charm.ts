import { defineCard } from "../define.js";

export default defineCard({
  name: "Rakdos Charm",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Exile target player's graveyard.\n" +
    "• Destroy target artifact.\n" +
    "• Each creature deals 1 damage to its controller.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Exile target player's graveyard.",
        targets: ["player"],
        effect: { kind: "exile-graveyard", target: 0 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Each creature deals 1 damage to its controller.",
        effect: { kind: "creatures-damage-controllers", filter: { type: "creature" }, amount: 1 },
      },
    ],
  },
});
