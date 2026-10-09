import { defineCard } from "../define.js";

// EDHREC rank 6438.
//
// The emblem counts each opponent's spells on their own: every opponent's
// first spell of a turn is countered (`firstEachTurn` is per caster).
const PLUS = "+1: Scry 1, then draw a card.";
const MINUS = "−2: Return target creature to its owner's hand.";
const EMBLEM = "Whenever an opponent casts their first spell each turn, counter that spell.";
const ULTIMATE = `−8: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Jace, Unraveler of Secrets",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Jace"],
  loyalty: 5,
  text: `${PLUS}\n${MINUS}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "scry", amount: 1, then: { kind: "draw", amount: 1 } },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: MINUS,
    },
    {
      loyaltyCost: -8,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        triggered: [
          {
            trigger: { on: "cast-spell", who: "opponent", firstEachTurn: true },
            targets: [],
            effect: { kind: "counter", target: "trigger-object" },
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
