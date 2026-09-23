import { defineCard } from "../define.js";

// "Their second card each turn" is the drawing player's own count, which is
// what `card-drawn`'s `nthThisTurn` is — and the 2023-04-14 ruling (the first
// card needn't have been drawn while you controlled Faerie Mastermind) is
// exactly that: the count is the player's, not the permanent's.
const DRAW_TEXT = "Whenever an opponent draws their second card each turn, you draw a card.";
const EACH_TEXT = "{3}{U}: Each player draws a card.";

export default defineCard({
  name: "Faerie Mastermind",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\n" + DRAW_TEXT + "\n" + EACH_TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "opponent", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: EACH_TEXT,
    },
  ],
});
