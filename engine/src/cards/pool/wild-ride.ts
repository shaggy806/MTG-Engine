import { defineCard } from "../define.js";

// EDHREC rank 5890.
//
// Rulings:
//   [2025-04-04] A spell cast using harmonize will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2025-04-04] Tapping a creature won't reduce colored mana components of harmonize costs.

const TEXT = "Target creature gets +3/+0 and gains haste until end of turn.";
const HARMONIZE_TEXT =
  "Harmonize {4}{R} (You may cast this card from your graveyard for its harmonize cost. You may tap a creature you control to reduce that cost by {X}, where X is its power. Then exile this spell.)";

export default defineCard({
  name: "Wild Ride",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: `${TEXT}\n${HARMONIZE_TEXT}`,
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 0, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
    ],
  },
  harmonize: { cost: "{4}{R}" },
});
