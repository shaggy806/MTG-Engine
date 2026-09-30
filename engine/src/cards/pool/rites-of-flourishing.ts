import { defineCard } from "../define.js";

const DRAW_TEXT = "At the beginning of each player's draw step, that player draws an additional card.";
const LAND_TEXT = "Each player may play an additional land on each of their turns.";

// Howling Mine's trigger without the untapped check (it goes on the stack
// after the turn's draw — its ruling), and an extra land drop that reaches
// every player, not only its controller.
export default defineCard({
  name: "Rites of Flourishing",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${DRAW_TEXT}\n${LAND_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "active-player" },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      extraLandsForEachPlayer: true,
      text: LAND_TEXT,
    },
  ],
});
