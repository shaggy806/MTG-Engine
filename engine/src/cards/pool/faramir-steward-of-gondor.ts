import { defineCard } from "../define.js";

// EDHREC rank 5251.
//
// Rulings:
//   [2023-06-16] If the triggered ability that causes the monarch to draw a card goes on the stack
//     and a different player becomes the monarch before that ability resolves, the first player
//     will still draw the card.
//   [2023-06-16] If combat damage dealt to the monarch causes that player to lose the game, the
//     triggered ability that causes the controller of the attacking creature to become the monarch
//     doesn't resolve. In most cases, the controller of the attacking creature will still become
//     the monarch as it is likely their turn.
//   [2023-06-16] There are two inherent triggered abilities associated with being the monarch.
//     These triggered abilities have no source and are controlled by the player who was the
//     monarch at the time the abilities triggered. The full texts of these abilities are "At the
//     beginning of the monarch's end step, that player draws a card" and "Whenever a creature
//     deals combat damage to the monarch, its controller becomes the monarch."
//   [2023-06-16] If the monarch leaves the game during another player's turn, that player becomes
//     the monarch. If the monarch leaves the game during their turn, the next player in turn order
//     becomes the monarch.
//   [2023-06-16] The game starts with no monarch. Once an effect makes one player the monarch, the
//     game will have exactly one monarch from that point forward. As a player becomes the monarch,
//     the current monarch (if any) ceases being the monarch.

const MONARCH_TEXT =
  "Whenever a legendary creature you control with mana value 4 or greater enters, you become the monarch.";
const TOKEN_TEXT =
  "At the beginning of your end step, if you're the monarch, create two 1/1 white Human Soldier creature tokens.";

export default defineCard({
  name: "Faramir, Steward of Gondor",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 2,
  toughness: 2,
  text: `${MONARCH_TEXT}\n${TOKEN_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", supertype: "legendary", manaValue: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: MONARCH_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "monarch", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 2 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
