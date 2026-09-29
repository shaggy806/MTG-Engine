import { defineCard } from "../define.js";

const TRIGGER_TEXT = "Whenever you discard a card, choose one that hasn't been chosen this turn —";
const DRAW_MODE = "Draw a card.";
const TREASURE_MODE = "Create a Treasure token.";
const DRAIN_MODE = "Each opponent loses 3 life.";

// Once per card discarded. The mode is chosen as it goes on the stack, so a
// discard of three cards takes all three; a fourth discard that turn finds
// nothing left and does nothing (the ruling).
export default defineCard({
  name: "Monument to Endurance",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${TRIGGER_TEXT}\n• ${DRAW_MODE}\n• ${TREASURE_MODE}\n• ${DRAIN_MODE}`,
  triggered: [
    {
      trigger: { on: "discards", who: "you", perCard: true },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        notChosenThisTurn: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: DRAW_MODE, effect: { kind: "draw", amount: 1 } },
          { text: TREASURE_MODE, effect: { kind: "create-token", token: "Treasure Token", count: 1 } },
          { text: DRAIN_MODE, effect: { kind: "lose-life", amount: 3, who: "each-opponent" } },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${DRAW_MODE} ${TREASURE_MODE} ${DRAIN_MODE}`,
    },
  ],
});
