import { defineCard } from "../define.js";

export default defineCard({
  name: "Unhinge",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target player discards a card.\nDraw a card.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "discard", target: 0, amount: 1 }, { kind: "draw", amount: 1 }],
  },
});
