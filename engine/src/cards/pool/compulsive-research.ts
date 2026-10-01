import { defineCard } from "../define.js";

// The player chooses: two cards, or a single land card.
export default defineCard({
  name: "Compulsive Research",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player draws three cards. Then that player discards two cards unless they discard a land card.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3, target: 0 },
      { kind: "discard", target: 0, amount: 2, unlessOne: { type: "land" } },
    ],
  },
});
