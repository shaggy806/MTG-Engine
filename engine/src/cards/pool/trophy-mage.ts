import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may search your library for an artifact card with mana value 3, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Trophy Mage",
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
        prompt: "Search for an artifact card with mana value 3?",
        effect: {
          kind: "search-library",
          filter: { type: "artifact", manaValue: { op: "eq", n: 3 } },
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
