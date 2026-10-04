import { defineCard } from "../define.js";

// EDHREC rank 4458.
// Makes Spirit → new token "Spirit Token (Kura, the Boundless Sky)".
//
// Atsushi, the Blazing Sky's shape: an announced modal dies trigger. X is the
// lands its controller controls as the token is made (`basePt`, read once).

const DIES_TEXT = "When Kura dies, choose one —";
const SEARCH_MODE =
  "Search your library for up to three land cards, reveal them, put them into your hand, then shuffle.";
const TOKEN_MODE = "Create an X/X green Spirit creature token, where X is the number of lands you control.";
const LANDS = { countOf: { type: "land", controlledBy: "you" } } as const;

export default defineCard({
  name: "Kura, the Boundless Sky",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Spirit"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "deathtouch"],
  text: `Flying, deathtouch\n${DIES_TEXT}\n• ${SEARCH_MODE}\n• ${TOKEN_MODE}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: SEARCH_MODE,
            effect: {
              kind: "search-library",
              filter: { type: "land" },
              destination: "hand",
              min: 0,
              max: 3,
              reveal: true,
            },
          },
          {
            text: TOKEN_MODE,
            effect: {
              kind: "create-token",
              token: "Spirit Token (Kura, the Boundless Sky)",
              count: 1,
              basePt: { power: LANDS, toughness: LANDS },
            },
          },
        ],
      },
      resolve: null,
      text: `${DIES_TEXT} ${SEARCH_MODE} ${TOKEN_MODE}`,
    },
  ],
});
