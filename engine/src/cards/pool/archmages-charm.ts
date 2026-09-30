import { defineCard } from "../define.js";

export default defineCard({
  name: "Archmage's Charm",
  manaCost: "{U}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Counter target spell.\n" +
    "• Target player draws two cards.\n" +
    "• Gain control of target nonland permanent with mana value 1 or less.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Counter target spell.",
        targets: ["spell"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "Target player draws two cards.",
        targets: ["player"],
        effect: { kind: "draw", amount: 2, target: 0 },
      },
      {
        text: "Gain control of target nonland permanent with mana value 1 or less.",
        targets: [{ kind: "permanent", filter: { notTypes: ["land"], manaValue: { op: "lte", n: 1 } } }],
        effect: { kind: "gain-control", target: 0, untilEndOfTurn: false },
      },
    ],
  },
});
