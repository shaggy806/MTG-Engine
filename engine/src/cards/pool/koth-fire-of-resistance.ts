import { defineCard } from "../define.js";

// EDHREC rank 4203.
//
// The emblem is colorless (its ruling): its damage is from a colorless
// source with no types, which is what the emblem object is.
const PLUS = "+2: Search your library for a basic Mountain card, reveal it, put it into your hand, then shuffle.";
const MINUS = "−3: Koth deals damage to target creature equal to the number of Mountains you control.";
const EMBLEM = "Whenever a Mountain you control enters, this emblem deals 4 damage to any target.";
const ULTIMATE = `−7: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Koth, Fire of Resistance",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Koth"],
  loyalty: 4,
  text: `${PLUS}\n${MINUS}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtype: "Mountain" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: { kind: "damage", target: 0, amount: { countOf: { subtype: "Mountain", controlledBy: "you" } } },
      resolve: null,
      text: MINUS,
    },
    {
      loyaltyCost: -7,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        triggered: [
          {
            trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Mountain" } },
            targets: ["any-target"],
            effect: { kind: "damage", amount: 4, target: 0 },
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
