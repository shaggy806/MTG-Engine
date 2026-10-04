import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 2668.
// Makes Treasure → uses "Treasure Token".
//
// Rulings:
//   [2026-06-29] Gleaming Splendor's activated ability requires two different target players. You
//     cannot target the same player twice with a single activation of the ability.
//   [2026-06-29] Gleaming Splendor doesn't need to have been under your control when the first
//     card is drawn for its ability to trigger. As long as you control it when an opponent draws
//     their second card in a turn, that ability will trigger. The ability can trigger only once
//     each turn for each opponent.

const TREASURE_TEXT = "Whenever an opponent draws their second card each turn, you create a Treasure token.";
const DRAW_TEXT = "{2}{W}: Two target players each draw a card.";

export default defineCard({
  name: "Gleaming Splendor",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${TREASURE_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      // Faerie Mastermind's trigger: the draw count is the player's for the
      // turn, whenever this came under your control.
      trigger: { on: "draws", who: "opponent", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false },
      // Two different players (the ruling).
      targets: distinctTargets(2, "player"),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, target: 0 },
          { kind: "draw", amount: 1, target: 1 },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
