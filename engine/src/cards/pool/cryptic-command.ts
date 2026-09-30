import { defineCard } from "../define.js";

export default defineCard({
  name: "Cryptic Command",
  manaCost: "{1}{U}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Choose two —\n" +
    "• Counter target spell.\n" +
    "• Return target permanent to its owner's hand.\n" +
    "• Tap all creatures your opponents control.\n" +
    "• Draw a card.",
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        text: "Counter target spell.",
        targets: ["spell"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "Return target permanent to its owner's hand.",
        targets: ["permanent"],
        effect: { kind: "return-to-hand", target: 0 },
      },
      {
        text: "Tap all creatures your opponents control.",
        targets: [],
        effect: { kind: "tap-all", filter: { type: "creature", controlledBy: "opponent" } },
      },
      {
        text: "Draw a card.",
        targets: [],
        effect: { kind: "draw", amount: 1 },
      },
    ],
  },
});
