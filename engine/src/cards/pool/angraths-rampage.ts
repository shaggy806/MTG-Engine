import { defineCard } from "../define.js";

export default defineCard({
  name: "Angrath's Rampage",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["sorcery"],
  text: "Choose one —\n• Target player sacrifices an artifact of their choice.\n• Target player sacrifices a creature of their choice.\n• Target player sacrifices a planeswalker of their choice.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target player sacrifices an artifact of their choice.",
        targets: ["player"],
        effect: { kind: "sacrifice", who: "target", filter: { type: "artifact" }, count: 1 },
      },
      {
        text: "Target player sacrifices a creature of their choice.",
        targets: ["player"],
        effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
      },
      {
        text: "Target player sacrifices a planeswalker of their choice.",
        targets: ["player"],
        effect: { kind: "sacrifice", who: "target", filter: { type: "planeswalker" }, count: 1 },
      },
    ],
  },
});
