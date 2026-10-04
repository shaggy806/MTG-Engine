import { defineCard } from "../define.js";

// EDHREC rank 5206.
//
// Rulings:
//   [2010-03-01] When the triggered ability resolves, first you choose which creature you'll
//     sacrifice (if you control any non-Vampire creatures), then each other player in turn order
//     does the same, then all chosen creatures are sacrificed at the same time.
//   [2010-03-01] If a player controls no creatures, or if all creatures a player controls are
//     Vampires, that player simply doesn't sacrifice anything.

export default defineCard({
  name: "Anowon, the Ruin Sage",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman"],
  power: 4,
  toughness: 3,
  text: "At the beginning of your upkeep, each player sacrifices a non-Vampire creature of their choice.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      // Fleshbag Marauder's shape: each player chooses in turn order, then the
      // chosen creatures are sacrificed together (the ruling).
      effect: {
        kind: "sacrifice",
        who: "each-player",
        filter: { type: "creature", notSubtypes: ["Vampire"] },
        count: 1,
      },
      resolve: null,
      text: "At the beginning of your upkeep, each player sacrifices a non-Vampire creature of their choice.",
    },
  ],
});
