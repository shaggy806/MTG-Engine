import { defineCard } from "../define.js";

// EDHREC rank 3727.
//
// Rulings:
//   [2011-01-22] Secrets of the Dead's triggered ability resolves before the spell you cast from
//     your graveyard does.

const TEXT = "Whenever you cast a spell from your graveyard, draw a card.";

export default defineCard({
  name: "Secrets of the Dead",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", from: "graveyard" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
