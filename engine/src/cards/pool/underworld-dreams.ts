import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever an opponent draws a card, this enchantment deals 1 damage to that player.";

export default defineCard({
  name: "Underworld Dreams",
  manaCost: "{B}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: DRAW_TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
