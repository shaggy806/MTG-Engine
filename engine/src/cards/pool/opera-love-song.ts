import { defineCard } from "../define.js";

// EDHREC rank 5294.
//
// Rulings:
//   [2025-06-06] You pay all costs and follow all timing rules for cards played this way. For
//     example, if one of the exiled cards is a land card, you may play it only during your main
//     phase while the stack is empty and only if you have an available land play remaining.

const EXILE_MODE = "Exile the top two cards of your library. You may play those cards until your next end step.";
const PUMP_MODE = "One or two target creatures each get +2/+0 until end of turn.";

export default defineCard({
  name: "Opera Love Song",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: `Choose one —\n• ${EXILE_MODE}\n• ${PUMP_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        // Haste Magic's "until your next end step".
        text: EXILE_MODE,
        targets: [],
        effect: { kind: "impulse-exile", amount: 2, duration: "your-next-end-step" },
      },
      {
        // Amazing Acrobatics' "one or two target creatures".
        text: PUMP_MODE,
        targets: ["creature", { kind: "optional", of: { kind: "other", of: "creature", than: { slot: 0 } } }],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
            { kind: "modify-pt", target: 1, power: 2, toughness: 0, duration: "end-of-turn" },
          ],
        },
      },
    ],
  },
});
