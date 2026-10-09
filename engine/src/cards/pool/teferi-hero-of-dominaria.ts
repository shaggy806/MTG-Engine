import { defineCard } from "../define.js";

// EDHREC rank 4136.
//
// - The +1's lands are chosen at the next end step (its ruling): the delayed
//   trigger asks then, any player's lands, as "untap up to two lands" does.
// - The emblem's target is chosen after the card is drawn (its ruling): the
//   trigger is put on the stack once the draw is done.
const PLUS = "+1: Draw a card. At the beginning of the next end step, untap up to two lands.";
const MINUS = "−3: Put target nonland permanent into its owner's library third from the top.";
const EMBLEM = "Whenever you draw a card, exile target permanent an opponent controls.";
const ULTIMATE = `−8: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Teferi, Hero of Dominaria",
  manaCost: "{3}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Teferi"],
  loyalty: 4,
  text: `${PLUS}\n${MINUS}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "delayed-trigger",
            at: "next-end-step",
            effect: {
              kind: "choose-permanents",
              filter: { type: "land" },
              upTo: 2,
              then: { kind: "untap", target: 0 },
              prompt: "Untap up to two lands",
            },
            text: "Untap up to two lands.",
          },
        ],
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [{ kind: "permanent", filter: { notTypes: ["land"] } }],
      effect: { kind: "put-on-library", target: 0, position: { fromTop: 3 } },
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
            trigger: { on: "draws", who: "you" },
            targets: [{ kind: "permanent", whose: "opponent", filter: {} }],
            effect: { kind: "exile", target: 0 },
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
