import { defineCard } from "../define.js";

// Converge: the colours of mana actually spent on this spell, cost increases
// included; a copy or a free cast spent none (the rulings).
const X = { colorsSpentOf: "source" } as const;

export default defineCard({
  name: "Painful Truths",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Converge — You draw X cards and lose X life, where X is the number of colors of mana spent to cast this spell.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: X },
      { kind: "lose-life", amount: X, who: "you" },
    ],
  },
});
