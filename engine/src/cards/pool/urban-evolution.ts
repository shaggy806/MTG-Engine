import { defineCard } from "../define.js";

// EDHREC rank 2390.
//
// Rulings:
//   [2018-12-07] Urban Evolution's effect allows you to play an additional land during your main
//     phase. Doing so follows the normal timing rules for playing lands. In particular, you don't
//     get to play a land as Urban Evolution resolves; Urban Evolution fully resolves first and you
//     draw three cards, perhaps including a land you'll play later.
//   [2018-12-07] The effects of multiple Urban Evolutions in the same turn are cumulative. They're
//     also cumulative with other effects that let you play additional lands, such as the one from
//     Explore.
//   [2018-12-07] If you somehow manage to cast Urban Evolution when it's not your turn, you'll
//     draw three cards when it resolves, but you won't be able to play a land that turn.

export default defineCard({
  name: "Urban Evolution",
  manaCost: "{3}{G}{U}",
  colors: ["U", "G"],
  types: ["sorcery"],
  text: "Draw three cards. You may play an additional land this turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "additional-land-drop", amount: 1 },
    ],
  },
});
