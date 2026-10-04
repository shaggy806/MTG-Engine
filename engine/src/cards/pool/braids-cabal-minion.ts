import { defineCard } from "../define.js";

// EDHREC rank 4841.
//
// Rulings:
//   [2016-06-08] At the beginning of your upkeep, triggered abilities you control will resolve
//     after triggered abilities your opponents control. If an opponent controls Braids and you
//     control a triggered ability that puts a permanent onto the battlefield, you won't be able to
//     sacrifice that permanent to satisfy Braids's ability.

// "That player" is whoever's upkeep it is (Archfiend of Depravity's
// `active-player`); they choose which permanent as it resolves.
const TEXT =
  "At the beginning of each player's upkeep, that player sacrifices an artifact, creature, or land of their choice.";

export default defineCard({
  name: "Braids, Cabal Minion",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Minion"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "active-player",
        filter: { typesAnyOf: ["artifact", "creature", "land"] },
        count: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
