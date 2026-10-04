import { defineCard } from "../define.js";

// EDHREC rank 3172.
//
// Rulings:
//   [2024-07-26] Lunar Convocation's first ability cares whether you gained life this turn, not
//     how your life total changed. For example, if you gained 2 life and lost 1 life in the same
//     turn, you still lost life. You also still gained life, which is relevant for Lunar
//     Convocation's second ability.
//   [2024-07-26] If you haven't gained life during the turn when your end step begins, Lunar
//     Convocation's first ability won't trigger at all. Gaining life during your end step won't
//     cause the ability to trigger.
//   [2024-07-26] Similarly, if you haven't both gained and lost life during the turn when your end
//     step begins, Lunar Convocation's second ability won't trigger at all. Gaining and/or losing
//     life during your end step won't cause the ability to trigger.

const DRAIN_TEXT = "At the beginning of your end step, if you gained life this turn, each opponent loses 1 life.";
const BAT_TEXT =
  "At the beginning of your end step, if you gained and lost life this turn, create a 1/1 black Bat creature token with flying.";
const DRAW_TEXT = "{1}{B}, Pay 2 life: Draw a card.";

export default defineCard({
  name: "Lunar Convocation",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["enchantment"],
  text: `${DRAIN_TEXT}\n${BAT_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: DRAIN_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: {
        kind: "all",
        of: [
          { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
          { kind: "turn-stat", stat: "life-lost", who: "you", atLeast: 1 },
        ],
      },
      targets: [],
      effect: { kind: "create-token", token: "Bat Token", count: 1 },
      resolve: null,
      text: BAT_TEXT,
    },
  ],
});
