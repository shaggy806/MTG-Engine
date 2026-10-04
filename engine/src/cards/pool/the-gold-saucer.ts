import { defineCard } from "../define.js";

// EDHREC rank 3394.
// Makes Treasure → "Treasure Token".
//
// Rulings:
//   [2025-06-06] Town is a land type with no special meaning. It doesn't grant the land any
//     intrinsic abilities. Other cards may care about which lands are Towns.

const FLIP_TEXT = "{2}, {T}: Flip a coin. If you win the flip, create a Treasure token.";
const DRAW_TEXT = "{3}, {T}, Sacrifice two artifacts: Draw a card.";

export default defineCard({
  name: "The Gold Saucer",
  colors: [],
  types: ["land"],
  subtypes: ["Town"],
  text: `{T}: Add {C}.\n${FLIP_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "flip-coin", won: { kind: "create-token", token: "Treasure Token", count: 1 } },
      resolve: null,
      text: FLIP_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true, sacrifice: { filter: { type: "artifact" }, count: 2 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
