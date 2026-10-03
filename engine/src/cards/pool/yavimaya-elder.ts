import { defineCard } from "../define.js";

const DIES_TEXT =
  "When this creature dies, you may search your library for up to two basic land cards, reveal them, put them into your hand, then shuffle.";
const DRAW_TEXT = "{2}, Sacrifice this creature: Draw a card.";

// The search is a "may": declining doesn't search, so it doesn't shuffle.
// Sacrificing it to its own ability triggers the dies ability, which resolves
// first — search, then draw (the ruling).
export default defineCard({
  name: "Yavimaya Elder",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 2,
  toughness: 1,
  text: `${DIES_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for up to two basic land cards?",
        effect: {
          kind: "search-library",
          filter: { supertype: "basic", type: "land" },
          destination: "hand",
          reveal: true,
          min: 0,
          max: 2,
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
