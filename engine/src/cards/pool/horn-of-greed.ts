import { defineCard } from "../define.js";

const TEXT = "Whenever a player plays a land, that player draws a card.";

// Played, not put onto the battlefield by an effect.
export default defineCard({
  name: "Horn of Greed",
  manaCost: "{3}",
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "plays-land", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "trigger-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});
