import { defineCard } from "../define.js";

const SEARCH_TEXT =
  "{W}, {T}: Search your library for a land card, reveal it, put it into your hand, then shuffle. " +
  "Activate only if an opponent controls more lands than you.";

export default defineCard({
  name: "Weathered Wayfarer",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Nomad", "Cleric"],
  power: 1,
  toughness: 1,
  text: SEARCH_TEXT,
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      condition: { kind: "opponent-controls-more", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
