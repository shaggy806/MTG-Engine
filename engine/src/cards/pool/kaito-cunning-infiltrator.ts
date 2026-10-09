import { defineCard } from "../define.js";

// EDHREC rank 4185.
// Makes "Ninja Token".
//
// - The +1's target is optional; a chosen target that's illegal as it
//   resolves stops the whole ability, draw and discard too (its ruling).
// - The emblem's trigger resolves before the spell that caused it, and
//   even if that spell is countered (its ruling); the Ninja is its
//   controller's.
const DAMAGE = "Whenever a creature you control deals combat damage to a player, put a loyalty counter on Kaito.";
const PLUS = "+1: Up to one target creature you control can't be blocked this turn. Draw a card, then discard a card.";
const MINUS = "−2: Create a 2/1 blue Ninja creature token.";
const EMBLEM = "Whenever a player casts a spell, you create a 2/1 blue Ninja creature token.";
const ULTIMATE = `−9: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Kaito, Cunning Infiltrator",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Kaito"],
  loyalty: 3,
  text: `${DAMAGE}\n${PLUS}\n${MINUS}\n${ULTIMATE}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "loyalty", amount: 1 },
      resolve: null,
      text: DAMAGE,
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [{ kind: "optional", of: "creature-you-control" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Ninja Token", count: 1 },
      resolve: null,
      text: MINUS,
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
            trigger: { on: "cast-spell", who: "any" },
            targets: [],
            effect: { kind: "create-token", token: "Ninja Token", count: 1 },
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
