import { defineCard } from "../define.js";

// EDHREC rank 5246.

const SEARCH_TEXT =
  "When this artifact enters, you may search your library for a basic land card, reveal it, then shuffle and put that card on top.";
const DRAW_TEXT = "{1}, Sacrifice this artifact: Draw a card.";

export default defineCard({
  name: "Fountainport Bell",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: `${SEARCH_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a basic land card?",
        effect: {
          kind: "search-library",
          filter: { supertype: "basic", type: "land" },
          destination: "library-top",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
