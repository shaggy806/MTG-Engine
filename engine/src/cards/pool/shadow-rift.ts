import { defineCard } from "../define.js";

// EDHREC rank 2892.

export default defineCard({
  name: "Shadow Rift",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gains shadow until end of turn. (It can block or be blocked by only creatures with shadow.)\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "shadow", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
