import { defineCard } from "../define.js";

// EDHREC rank 3610.
//
// Rulings:
//   [2004-10-04] The card is face-up when exiled.
//   [2004-10-04] If the card is not played by end of turn, it remains exiled until end of game.
//   [2022-12-08] The triggered ability that creates the copies can itself be countered by anything
//     that can counter a triggered ability. If it is countered, no copies will be put onto the
//     stack.
//   [2022-12-08] Spells cast from zones other than a player's hand and spells that were countered
//     are counted by the storm ability.
//   [2022-12-08] The copies are put directly onto the stack. They aren't cast and won't be counted
//     by other spells with storm cast later in the turn.
//   [2022-12-08] A copy of a spell can be countered like any other spell, but it must be countered
//     individually. Countering a spell with storm won't affect the copies.

// Each storm copy shuffles and exiles a card of its own. The permission is
// only to play the card free (a land as a land play); one not played stays
// exiled (the ruling).
const STORM_TEXT = "Storm (When you cast this spell, copy it for each spell cast before it this turn.)";

export default defineCard({
  name: "Mind's Desire",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: `Shuffle your library. Then exile the top card of your library. Until end of turn, you may play that card without paying its mana cost.\n${STORM_TEXT}`,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "shuffle-library" },
      { kind: "impulse-exile", amount: 1, duration: "end-of-turn", free: { only: true } },
    ],
  },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: STORM_TEXT,
    },
  ],
});
