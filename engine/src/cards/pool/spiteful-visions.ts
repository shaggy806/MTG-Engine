import { defineCard } from "../define.js";

const DRAW_STEP_TEXT = "At the beginning of each player's draw step, that player draws an additional card.";
const PING_TEXT = "Whenever a player draws a card, this enchantment deals 1 damage to that player.";

export default defineCard({
  name: "Spiteful Visions",
  manaCost: "{2}{B/R}{B/R}",
  colors: ["B", "R"],
  types: ["enchantment"],
  text: `${DRAW_STEP_TEXT}\n${PING_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "active-player" },
      resolve: null,
      text: DRAW_STEP_TEXT,
    },
    {
      trigger: { on: "draws", who: "any" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: PING_TEXT,
    },
  ],
});
