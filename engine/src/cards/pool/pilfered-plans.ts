import { defineCard } from "../define.js";

export default defineCard({
  name: "Pilfered Plans",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  types: ["sorcery"],
  text: "Target player mills two cards. Draw two cards.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "mill", target: 0, amount: 2 },
      { kind: "draw", amount: 2 },
    ],
  },
});
