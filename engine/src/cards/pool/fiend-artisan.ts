import { defineCard } from "../define.js";

// EDHREC rank 4401.
//
// Rulings:
//   [2020-04-17] If a card in a player's library has {X} in its mana cost, X is considered to be
//     0.
//   [2020-04-17] Fiend Artisan's first ability applies only while it's on the battlefield.

const PUMP_TEXT = "This creature gets +1/+1 for each creature card in your graveyard.";
const SEARCH_TEXT =
  "{X}{B/G}, {T}, Sacrifice another creature: Search your library for a creature card with mana value X or less, put it onto the battlefield, then shuffle. Activate only as a sorcery.";

export default defineCard({
  name: "Fiend Artisan",
  manaCost: "{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Nightmare"],
  power: 1,
  toughness: 1,
  text: `${PUMP_TEXT}\n${SEARCH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { inGraveyard: { type: "creature", ownedBy: "you" }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{X}{B/G}", tap: true, sacrifice: "creature-you-control" },
      otherOnly: true,
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature", manaValue: { op: "lte", n: "x" } },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
