import { defineCard } from "../define.js";

// EDHREC rank 4913.
//
// Rulings:
//   [2026-03-20] If a permanent has {X} in its mana cost, X is 0 for the purpose of determining
//     its mana value.
//
// The first mode is Springbloom Druid's "you may sacrifice …. If you do" shape: a `may`
// around the sacrifice, the draw gated on what was sacrificed this way.

const SAC_TEXT = "You may sacrifice a permanent. If you do, draw two cards.";
const LIFE_TEXT = "You gain 5 life.";
const DESTROY_TEXT = "Destroy target nonland permanent with mana value 2 or less.";

export default defineCard({
  name: "Witherbloom Charm",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: `Choose one —\n• ${SAC_TEXT}\n• ${LIFE_TEXT}\n• ${DESTROY_TEXT}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: SAC_TEXT,
        targets: [],
        effect: {
          kind: "may",
          prompt: "Sacrifice a permanent to draw two cards?",
          effect: {
            kind: "sequence",
            effects: [
              { kind: "sacrifice", who: "you", filter: {}, count: 1 },
              {
                kind: "conditional",
                condition: { kind: "this-way", what: "sacrificed", atLeast: 1 },
                then: { kind: "draw", amount: 2 },
              },
            ],
          },
        },
      },
      {
        text: LIFE_TEXT,
        targets: [],
        effect: { kind: "gain-life", amount: 5 },
      },
      {
        text: DESTROY_TEXT,
        targets: [{ kind: "permanent", filter: { notTypes: ["land"], manaValue: { op: "lte", n: 2 } } }],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
