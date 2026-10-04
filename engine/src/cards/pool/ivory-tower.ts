import { defineCard } from "../define.js";

// EDHREC rank 5799.
//
// Rulings:
//   [2004-10-04] If you have four or fewer cards in your hand when Ivory Tower's ability resolves,
//     the ability has no effect.

const TEXT = "At the beginning of your upkeep, you gain X life, where X is the number of cards in your hand minus 4.";

export default defineCard({
  name: "Ivory Tower",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      // `difference` never goes below 0, and a gain of 0 is no life gained
      // (no `gains-life` trigger), which is the ruling's "no effect".
      effect: { kind: "gain-life", amount: { difference: [{ cardsInHand: "you" }, 4] } },
      resolve: null,
      text: TEXT,
    },
  ],
});
