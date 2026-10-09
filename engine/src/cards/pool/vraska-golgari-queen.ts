import { defineCard } from "../define.js";

// EDHREC rank 4209.
//
// The +2's sacrifice is chosen as it resolves (its ruling), any other
// permanent of yours or none; only one sacrificed draws and gains.
const PLUS = "+2: You may sacrifice another permanent. If you do, you gain 1 life and draw a card.";
const MINUS = "−3: Destroy target nonland permanent with mana value 3 or less.";
const EMBLEM = "Whenever a creature you control deals combat damage to a player, that player loses the game.";
const ULTIMATE = `−9: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Vraska, Golgari Queen",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Vraska"],
  loyalty: 4,
  text: `${PLUS}\n${MINUS}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Sacrifice another permanent to gain 1 life and draw a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "sacrifice", who: "you", filter: {}, count: 1, exceptSource: true },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "sacrificed", atLeast: 1 },
              then: {
                kind: "sequence",
                effects: [
                  { kind: "gain-life", amount: 1 },
                  { kind: "draw", amount: 1 },
                ],
              },
            },
          ],
        },
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [{ kind: "permanent", filter: { notTypes: ["land"], manaValue: { op: "lte", n: 3 } } }],
      effect: { kind: "destroy", target: 0 },
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
            trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
            targets: [],
            effect: { kind: "lose-game", who: "trigger-player" },
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
