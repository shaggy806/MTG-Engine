import { defineCard } from "../define.js";

// EDHREC rank 5903.
//
// Rulings:
//   [2025-04-04] A spell cast using harmonize will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2025-04-04] Tapping a creature won't reduce colored mana components of harmonize costs.

const TEXT = "Draw three cards. Then discard two cards unless you discard a creature card.";
const HARMONIZE_TEXT =
  "Harmonize {4}{U} (You may cast this card from your graveyard for its harmonize cost. You may tap a creature you control to reduce that cost by {X}, where X is its power. Then exile this spell.)";

export default defineCard({
  name: "Winternight Stories",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: `${TEXT}\n${HARMONIZE_TEXT}`,
  // Thirst for Discovery's "unless you discard a … card" shape.
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "discard", target: "you", amount: 2, unlessOne: { type: "creature" } },
    ],
  },
  harmonize: { cost: "{4}{U}" },
});
