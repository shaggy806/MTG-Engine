import { defineCard } from "../define.js";

/**
 * A counter, not a bounce: "if that spell is countered this way" means a
 * spell that can't be countered stays on the stack and resolves (the draw
 * still happens), and a countered copy of a spell ceases to exist rather than
 * going to a hand (rule 707.10c). A flashed-back spell is exiled instead
 * (rule 702.34a), and a commander may go to the command zone (rule 903.9b).
 */
export default defineCard({
  name: "Remand",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Counter target spell. If that spell is countered this way, put it into its owner's hand instead of into that player's graveyard.\nDraw a card.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0, into: "hand" },
      { kind: "draw", amount: 1 },
    ],
  },
});
