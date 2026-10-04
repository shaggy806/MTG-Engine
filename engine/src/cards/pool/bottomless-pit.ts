import { defineCard } from "../define.js";

// EDHREC rank 5459.
//
// Rulings:
//   [2004-10-04] The ability is controlled by the player who controls Bottomless Pit. This means
//     that Bottomless Pit can trigger abilities which trigger off an opponent forcing you to
//     discard.

const TEXT = "At the beginning of each player's upkeep, that player discards a card at random.";

// "That player" is whoever's upkeep it is (Braids, Cabal Minion's `active-player`).
export default defineCard({
  name: "Bottomless Pit",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: { kind: "discard", target: "active-player", amount: 1, random: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
