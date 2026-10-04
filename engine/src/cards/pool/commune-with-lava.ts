import { defineCard } from "../define.js";

// EDHREC rank 3931.
//
// Rulings:
//   [2015-02-25] Playing a card this way follows the normal rules for playing the card. You must
//     pay its costs, and you must follow all applicable timing rules. For example, if one of the
//     cards is a creature card, you can cast that card only during your main phase while the stack
//     is empty.
//   [2015-02-25] Under normal circumstances, you can play a land card exiled with Commune with
//     Lava only if you haven't played a land yet that turn.
//   [2015-02-25] The cards are exiled face up.
//   [2015-02-25] Any cards you don't play will remain exiled.
//
// Zenith Festival's shape: "your-next-turn" lapses as the caster's next turn
// ends, whether it was cast on their own turn or another player's.

export default defineCard({
  name: "Commune with Lava",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Exile the top X cards of your library. Until the end of your next turn, you may play those cards.",
  effect: { kind: "impulse-exile", amount: "x", duration: "your-next-turn" },
});
