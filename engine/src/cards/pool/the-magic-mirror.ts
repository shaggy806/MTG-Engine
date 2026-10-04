import { defineCard } from "../define.js";

// EDHREC rank 4952.
//
// Rulings:
//   [2019-10-04] If a split card is both an instant card and a sorcery card, it's only counted
//     once for The Magic Mirror's cost reduction ability.
//   [2019-10-04] The cost reduction ability reduces only the generic mana in the relic's cost. The
//     colored mana must still be paid.
//   [2019-10-04] If The Magic Mirror leaves the battlefield while its last ability is on the
//     stack, the ability will use the number of knowledge counters The Magic Mirror had before
//     leaving the battlefield to determine how many cards you'll draw.
//
// Karador's unconditional graveyard-count reduction (`typesAnyOf` counts a
// card once); the draw reads the counters through `countersOn: "source"`,
// which is last-known information once the Mirror has left.
const COST_TEXT = "This spell costs {1} less to cast for each instant and sorcery card in your graveyard.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, put a knowledge counter on The Magic Mirror, then draw a card for each knowledge counter on The Magic Mirror.";

export default defineCard({
  name: "The Magic Mirror",
  manaCost: "{6}{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\nYou have no maximum hand size.\n${UPKEEP_TEXT}`,
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { cardsInGraveyard: { typesAnyOf: ["instant", "sorcery"] } },
  },
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "knowledge", amount: 1 },
          { kind: "draw", amount: { countersOn: "source", counter: "knowledge" } },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
});
