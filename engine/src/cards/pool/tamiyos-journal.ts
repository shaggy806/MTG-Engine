import { defineCard } from "../define.js";

// EDHREC rank 2555.
// Makes Clue → use "Clue Token".
//
// Rulings:
//   [2016-04-08] If an effect refers to a Clue, it means any Clue artifact, not just a Clue
//     artifact token.
//   [2016-04-08] You can't sacrifice a Clue to pay multiple costs.

const TUTOR_TEXT = "{T}, Sacrifice three Clues: Search your library for a card, put that card into your hand, then shuffle.";

export default defineCard({
  name: "Tamiyo's Journal",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Book"],
  text: `At the beginning of your upkeep, investigate. (Create a Clue token. It's an artifact with "{2}, Sacrifice this token: Draw a card.")\n${TUTOR_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, investigate.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Clue" }, count: 3 } },
      targets: [],
      effect: { kind: "search-library", filter: {}, destination: "hand", min: 0, max: 1 },
      resolve: null,
      text: TUTOR_TEXT,
    },
  ],
});
