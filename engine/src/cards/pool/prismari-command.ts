import { defineCard } from "../define.js";

export default defineCard({
  name: "Prismari Command",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text:
    "Choose two —\n" +
    "• Prismari Command deals 2 damage to any target.\n" +
    "• Target player draws two cards, then discards two cards.\n" +
    "• Target player creates a Treasure token.\n" +
    "• Destroy target artifact.",
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        text: "Prismari Command deals 2 damage to any target.",
        targets: ["any-target"],
        effect: { kind: "damage", amount: 2, target: 0 },
      },
      {
        text: "Target player draws two cards, then discards two cards.",
        targets: ["player"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 2, target: 0 },
            { kind: "discard", target: 0, amount: 2 },
          ],
        },
      },
      {
        text: "Target player creates a Treasure token.",
        targets: ["player"],
        effect: { kind: "create-token", token: "Treasure Token", count: 1, who: "target-controller" },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
