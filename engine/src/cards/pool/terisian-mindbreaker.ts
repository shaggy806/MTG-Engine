import { defineCard } from "../define.js";
import { unearth } from "../helpers.js";

// EDHREC rank 4710.
//
// Rulings:
//   [2022-10-14] If you attack the same player with two Terisian Mindbreakers, that player will
//     mill half their library as the first Mindbreaker's ability resolves. Then they will mill
//     half of what remains in their library as the second Mindbreaker's ability resolves.
// The half is read from the defending player's library as each trigger resolves.

const MILL_TEXT = "Whenever this creature attacks, defending player mills half their library, rounded up.";

export default defineCard({
  name: "Terisian Mindbreaker",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Juggernaut"],
  power: 6,
  toughness: 4,
  text:
    `${MILL_TEXT}\n` +
    "Unearth {1}{U}{U}{U} ({1}{U}{U}{U}: Return this card from your graveyard to the battlefield. It gains haste. Exile it at the beginning of the next end step or if it would leave the battlefield. Unearth only as a sorcery.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "trigger-player", amount: { half: { librarySize: "each" }, round: "up" } },
      resolve: null,
      text: MILL_TEXT,
    },
  ],
  activated: [unearth("{1}{U}{U}{U}")],
});
