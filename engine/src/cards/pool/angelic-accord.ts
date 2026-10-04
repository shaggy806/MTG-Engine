import { defineCard } from "../define.js";

// EDHREC rank 3398.
//
// Rulings:
//   [2017-11-17] If you haven’t gained 4 or more life during the turn when the end step begins,
//     the ability won’t trigger at all. Gaining life during the end step won’t cause the ability
//     to trigger.
//   [2017-11-17] In a Two-Headed Giant game, life gained by your teammate isn’t considered, even
//     though it causes your team’s life total to increase.
//   [2017-11-17] Angelic Accord’s ability checks how much life you’ve gained during the turn, not
//     what your life total is compared to what it was when the turn began. For example, if you
//     start the turn at 10 life, gain 6 life during the turn, then lose 6 life later that turn,
//     the ability will trigger.

const TEXT =
  "At the beginning of each end step, if you gained 4 or more life this turn, create a 4/4 white Angel creature token with flying.";

export default defineCard({
  name: "Angelic Accord",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      // The Gaffer's shape: an intervening "if" on the turn's life gained.
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 4 },
      targets: [],
      effect: { kind: "create-token", token: "4/4 Angel Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
