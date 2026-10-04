import { defineCard } from "../define.js";

// EDHREC rank 5301.
//
// Rulings:
//   [2020-08-07] Braids's effect doesn't count as playing a land if you put one onto the
//     battlefield with it. You can still play a land for the turn during your main phase.
//   [2020-08-07] If the permanent you put onto the battlefield has an ability that triggers at the
//     beginning of your upkeep, it won't trigger during that upkeep.

const TEXT =
  "At the beginning of each player's upkeep, that player may put an artifact, creature, or land card from their hand onto the battlefield.";

// Kynaios and Tiro's `putFromHand` option, asked only of the player whose
// upkeep it is (Braids, Cabal Minion's `"active-player"`). It's that player's
// effect, so the card enters under their control; a put, not a land play.
export default defineCard({
  name: "Braids, Conjurer Adept",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "active-player",
        options: [
          {
            putFromHand: { typesAnyOf: ["artifact", "creature", "land"] },
            text: "Put an artifact, creature, or land card from your hand onto the battlefield",
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
