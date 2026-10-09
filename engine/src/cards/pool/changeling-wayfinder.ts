import { defineCard } from "../define.js";

// EDHREC rank 4753.

export default defineCard({
  name: "Changeling Wayfinder",
  manaCost: "{3}",
  colors: [],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 2,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)\nWhen this creature enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
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
          destination: "hand",
          min: 0,
          max: 1,
          reveal: true,
        },
      },
      resolve: null,
      text: "When this creature enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
