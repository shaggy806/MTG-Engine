import { defineCard } from "../define.js";

// EDHREC rank 6102.

const SEARCH_TEXT =
  "When this creature enters, you may search your library for a creature card with defender, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Shield-Wall Sentinel",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 1,
  toughness: 3,
  keywords: ["defender"],
  text: `Defender\n${SEARCH_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a creature card with defender?",
        effect: {
          kind: "search-library",
          filter: { type: "creature", keyword: "defender" },
          destination: "hand",
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
