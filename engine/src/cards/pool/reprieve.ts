import { defineCard } from "../define.js";

// Not a counter: a spell that can't be countered still goes back to its
// owner's hand, and a copy of a spell ceases to exist (rule 707.10c).
export default defineCard({
  name: "Reprieve",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Return target spell to its owner's hand.\nDraw a card.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0, from: "stack" },
      { kind: "draw", amount: 1 },
    ],
  },
});
