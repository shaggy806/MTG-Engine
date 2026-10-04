import { defineCard } from "../define.js";

// EDHREC rank 5470.

const TEXT =
  "When this creature enters, you may search your library for an artifact card with mana value 4 or 5, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Transit Mage",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search for an artifact card with mana value 4 or 5?",
        effect: {
          kind: "search-library",
          filter: {
            type: "artifact",
            anyOf: [{ manaValue: { op: "eq", n: 4 } }, { manaValue: { op: "eq", n: 5 } }],
          },
          destination: "hand",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
