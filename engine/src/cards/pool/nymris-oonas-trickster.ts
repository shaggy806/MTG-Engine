import { defineCard } from "../define.js";

// EDHREC rank 5656.
//
// Wavebreak Hippocamp's trigger: the first spell you cast in a turn that
// isn't yours (every other player is an opponent), once per such turn.
// Forbidden Alchemy's look: one of the two to hand, the other to the
// graveyard.
const TEXT =
  "Whenever you cast your first spell during each opponent's turn, look at the top two cards of your library. Put one of those cards into your hand and the other into your graveyard.";

export default defineCard({
  name: "Nymris, Oona's Trickster",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Knight"],
  power: 1,
  toughness: 6,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", firstEachTurn: true },
      condition: { kind: "not", of: { kind: "your-turn" } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 2,
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "graveyard",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
