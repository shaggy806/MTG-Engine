import { defineCard } from "../define.js";

// With its one target gone it does nothing at all — no card is drawn (the
// ruling).
export default defineCard({
  name: "Enter the Enigma",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target creature can't be blocked this turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
