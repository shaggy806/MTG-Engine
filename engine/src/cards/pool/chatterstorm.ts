import { defineCard } from "../define.js";

// EDHREC rank 2835.
// Makes Squirrel → use "Squirrel Token".
//
// Rulings:
//   [2021-06-18]  If a spell with storm has targets, you may choose new targets for any of the
//     copies. You can make different choices for each copy.
//   [2021-06-18]  The copies are put directly onto the stack. They aren't cast and won't be
//     counted by other spells with storm cast later in the turn.
//   [2021-06-18]  A copy of a spell can be countered like any other spell, but it must be
//     countered individually. Countering a spell with storm won't affect the copies.
//   [2021-06-18]  Spells cast from zones other than a player's hand and spells that were countered
//     or otherwise failed to resolve are counted by the storm ability.
//   [2021-06-18]  The triggered ability that creates the copies can itself be countered by
//     anything that can counter a triggered ability. If it is countered, no copies will be put
//     onto the stack.

export default defineCard({
  name: "Chatterstorm",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Create a 1/1 green Squirrel creature token.\nStorm (When you cast this spell, copy it for each spell cast before it this turn.)",
  effect: { kind: "create-token", token: "Squirrel Token", count: 1 },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm (When you cast this spell, copy it for each spell cast before it this turn.)",
    },
  ],
});
