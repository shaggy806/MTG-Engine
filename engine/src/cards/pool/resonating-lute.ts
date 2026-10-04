import { defineCard } from "../define.js";

// EDHREC rank 2845.
//
// Rulings:
//   [2026-03-20] Once you've activated Resonating Lute's last ability, it doesn't matter if the
//     number of cards in your hand drops below seven. The ability will still resolve as normal.

const GRANTED_TEXT = "{T}: Add two mana of any one color. Spend this mana only to cast instant and sorcery spells.";
const LANDS_TEXT = `Lands you control have "${GRANTED_TEXT}"`;
const DRAW_TEXT = "{T}: Draw a card. Activate only if you have seven or more cards in your hand.";

export default defineCard({
  name: "Resonating Lute",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  types: ["artifact"],
  text: `${LANDS_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "land", controlledBy: "you" } },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          // `any-color` with an amount above 1 is that much of one colour.
          effect: {
            kind: "add-mana",
            mana: "any-color",
            amount: 2,
            spendOnly: {
              spell: { typesAnyOf: ["instant", "sorcery"] },
              text: "Spend this mana only to cast instant and sorcery spells.",
            },
          },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: LANDS_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      condition: { kind: "hand-size", atLeast: 7 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
