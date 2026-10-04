import { defineCard } from "../define.js";

// EDHREC rank 4394.
//
// Rulings:
//   [2024-04-12] If Baron Bertram Graywater enters under your control and is itself a token, its
//     own ability will trigger and you'll create a Vampire Rogue token.

const TOKEN_TEXT =
  "Whenever one or more tokens you control enter, create a 1/1 black Vampire Rogue creature token with lifelink. This ability triggers only once each turn.";
const DRAW_TEXT = "{1}{B}, Sacrifice another creature or artifact: Draw a card.";

export default defineCard({
  name: "Baron Bertram Graywater",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 3,
  toughness: 4,
  text: `${TOKEN_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true }, batched: true },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Vampire Rogue Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
  activated: [
    {
      cost: {
        mana: "{1}{B}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["creature", "artifact"] } },
      },
      otherOnly: true,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
