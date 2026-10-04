import { defineCard } from "../define.js";

// EDHREC rank 6076.
//
// Rulings:
//   [2025-06-06] If multiple cards leave your graveyard at the same time, Fang's ability will
//     trigger only once.
//
// The front half of a meld pair, as Hanweir Garrison is: melding is Vanille,
// Cheerful l'Cie's ability, not this card's, and Vanille isn't in the pool,
// so nothing on this card is left out — its line about melding is reminder
// text. "One or more cards leave" is the batched `leaves-graveyard` trigger
// (Teval, the Balanced Scale), held to once a turn (Kishla Skimmer).
const TEXT =
  "Whenever one or more cards leave your graveyard, you draw a card and you lose 1 life. This ability triggers only once each turn.";

export default defineCard({
  name: "Fang, Fearless l'Cie",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  text: `${TEXT}\n(Melds with Vanille, Cheerful l'Cie.)`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      oncePerTurn: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
