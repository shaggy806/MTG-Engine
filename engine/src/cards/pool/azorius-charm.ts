import { defineCard } from "../define.js";

// EDHREC rank 6368.
//
// Rulings:
//   [2017-11-17] Multiple instances of lifelink on the same creature are redundant.

const LIFELINK_MODE = "Creatures you control gain lifelink until end of turn.";
const DRAW_MODE = "Draw a card.";
const TUCK_MODE = "Put target attacking or blocking creature on top of its owner's library.";

export default defineCard({
  name: "Azorius Charm",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: `Choose one —\n• ${LIFELINK_MODE}\n• ${DRAW_MODE}\n• ${TUCK_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: LIFELINK_MODE,
        targets: [],
        effect: {
          kind: "grant-keyword-all",
          filter: { type: "creature", controlledBy: "you" },
          keyword: "lifelink",
          duration: "end-of-turn",
        },
      },
      {
        text: DRAW_MODE,
        targets: [],
        effect: { kind: "draw", amount: 1 },
      },
      {
        text: TUCK_MODE,
        targets: [
          { kind: "permanent", filter: { type: "creature", anyOf: [{ attacking: true }, { blocking: true }] } },
        ],
        effect: { kind: "put-on-library", target: 0, position: "top" },
      },
    ],
  },
});
