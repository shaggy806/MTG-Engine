import { defineCard } from "../define.js";

/**
 * Returning a spell to its owner's hand is not countering it (rule 701.5), so
 * Remand still works on a spell that "can't be countered". A copy of a spell
 * has no card to go back to a hand and ceases to exist (rule 707.10c).
 */
export default defineCard({
  name: "Remand",
  manaCost: "{1}{U}",
  colors: ["U"],
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
