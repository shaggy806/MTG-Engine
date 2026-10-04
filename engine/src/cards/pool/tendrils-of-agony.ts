import { defineCard } from "../define.js";

// EDHREC rank 5615.
//
// Brain Freeze's storm: every spell cast before it this turn, by any player,
// counts; each copy may get a new target player (the rulings).
//
// Rulings:
//   [2022-12-08] The copies are put directly onto the stack. They aren't cast and won't be counted
//     by other spells with storm cast later in the turn.
//   [2022-12-08] The triggered ability that creates the copies can itself be countered by anything
//     that can counter a triggered ability. If it is countered, no copies will be put onto the
//     stack.
//   [2022-12-08] Spells cast from zones other than a player's hand and spells that were countered
//     are counted by the storm ability.
//   [2022-12-08] You may choose new targets for any of the copies. You can make different choices
//     for each copy.
//   [2022-12-08] A copy of a spell can be countered like any other spell, but it must be countered
//     individually. Countering a spell with storm won't affect the copies.

const STORM_TEXT =
  "Storm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)";

export default defineCard({
  name: "Tendrils of Agony",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: `Target player loses 2 life and you gain 2 life.\n${STORM_TEXT}`,
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "lose-life", amount: 2, target: 0 },
      { kind: "gain-life", amount: 2 },
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
