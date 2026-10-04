import { defineCard } from "../define.js";

// EDHREC rank 2758.
//
// Rulings:
//   [2015-08-25] Devoid works in all zones, not just on the battlefield.
//   [2015-08-25] The cards are exiled from the library face up.
//   [2015-08-25] If that player has one card in their library when Sire of Stagnation's triggered
//     ability resolves, that card will be exiled. If their library has zero cards, no cards are
//     exiled. In both cases, you'll still draw two cards. That player won't lose the game (until
//     they attempt to draw a card from an empty library).
//
// Devoid (rule 702.114) is `colors: []`. "That player" is the land's
// controller — the trigger object's (`"trigger-controller"`).

const LAND_TEXT =
  "Whenever a land an opponent controls enters, that player exiles the top two cards of their library and you draw two cards.";

export default defineCard({
  name: "Sire of Stagnation",
  manaCost: "{4}{U}{B}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 5,
  toughness: 7,
  text: `Devoid (This card has no color.)\n${LAND_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { type: "land", controlledBy: "opponent" },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-from-library", whose: "trigger-controller", amount: 2 },
          { kind: "draw", amount: 2 },
        ],
      },
      resolve: null,
      text: LAND_TEXT,
    },
  ],
});
