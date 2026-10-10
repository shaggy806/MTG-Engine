import { defineCard } from "../define.js";

// EDHREC rank 6624. "Wild Magic Surge" is an ability word. Each row is
// Breeches's impulse.
const TEXT =
  "Wild Magic Surge — Whenever this creature attacks, roll a d20.\n1—9 | Exile the top card of your library. You may play it this turn.\n10—19 | Exile the top two cards of your library. You may play them this turn.\n20 | Exile the top three cards of your library. You may play them this turn.";

export default defineCard({
  name: "Chaos Channeler",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 4,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "roll-dice",
        sides: 20,
        table: [
          { min: 1, max: 9, effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" } },
          { min: 10, max: 19, effect: { kind: "impulse-exile", amount: 2, duration: "end-of-turn" } },
          { min: 20, effect: { kind: "impulse-exile", amount: 3, duration: "end-of-turn" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
