import { defineCard } from "../define.js";

// EDHREC rank 4384.
// Makes "Thopter Token".
//
// The 0's artifact count is read as it resolves. The emblem's search is for
// any permanent card — not an instant or sorcery — and may find nothing.
const PLUS = "+1: Create a 1/1 colorless Thopter artifact creature token with flying.";
const ZERO = "0: Draw a card. If you control three or more artifacts, draw two cards instead.";
const EMBLEM =
  "At the beginning of your end step, search your library for a permanent card, put it onto the battlefield, then shuffle.";
const ULTIMATE = `−9: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Tezzeret, Artifice Master",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Tezzeret"],
  loyalty: 5,
  text: `${PLUS}\n${ZERO}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 3 },
        then: { kind: "draw", amount: 2 },
        else: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: ZERO,
    },
    {
      loyaltyCost: -9,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        triggered: [
          {
            trigger: { on: "step-begins", step: "end", who: "you" },
            targets: [],
            effect: {
              kind: "search-library",
              filter: { notTypes: ["instant", "sorcery"] },
              destination: "battlefield",
              min: 0,
              max: 1,
            },
            resolve: null,
            text: EMBLEM,
          },
        ],
      },
      resolve: null,
      text: ULTIMATE,
    },
  ],
});
