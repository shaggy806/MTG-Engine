import { defineCard } from "../define.js";

// The land comparison is an intervening-if (rule 603.4): asked as the upkeep
// begins and again as the ability resolves.
export default defineCard({
  name: "Land Tax",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "At the beginning of your upkeep, if an opponent controls more lands than you, you may search your library for up to three basic land cards, reveal them, put them into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "opponent-controls-more", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for up to three basic land cards?",
        effect: {
          kind: "search-library",
          filter: { type: "land", supertype: "basic" },
          destination: "hand",
          min: 0,
          max: 3,
          reveal: true,
        },
      },
      resolve: null,
      text:
        "At the beginning of your upkeep, if an opponent controls more lands than you, you may search your library for up to three basic land cards, reveal them, put them into your hand, then shuffle.",
    },
  ],
});
