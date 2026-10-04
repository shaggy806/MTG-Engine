import { defineCard } from "../define.js";

// EDHREC rank 4180.
//
// Rulings:
//   [2022-06-10] You must pay all costs and follow all normal timing rules for cards played this
//     way. For example, you may only play a land from exile this way during your main phase while
//     the stack is empty, and only if you haven't played a land yet this turn.
//
// The two halves of the first ability watch two different events, so they're
// two triggers, as Fire Lord Zuko's "whenever you cast a spell from exile and
// whenever a permanent you control enters from exile" is.

const TOKEN_TEXT =
  "Whenever you cast a spell from exile or a land you control enters from exile, create a 2/2 green Wolf creature token.";
const IMPULSE_TEXT = "{1}, {T}, Discard a card: Exile the top card of your library. You may play it this turn.";

export default defineCard({
  name: "Faldorn, Dread Wolf Herald",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 3,
  toughness: 3,
  text: `${TOKEN_TEXT}\n${IMPULSE_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: true, discard: { count: 1 } },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: IMPULSE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", from: "exile" },
      targets: [],
      effect: { kind: "create-token", token: "Wolf Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land", enteredFrom: "exile" } },
      targets: [],
      effect: { kind: "create-token", token: "Wolf Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
