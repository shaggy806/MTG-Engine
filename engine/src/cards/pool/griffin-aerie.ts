import { defineCard } from "../define.js";

// EDHREC rank 5284.
//
// Rulings:
//   [2020-06-23] If you haven't gained 3 life by the time your end step begins, Griffin Aerie's
//     ability won't trigger at all.
//   [2020-06-23] You create just one Griffin token, no matter how much life you've gained past 3
//     life.
//   [2020-06-23] Griffin Aerie's ability looks at how much life you've gained in the turn, even if
//     it wasn't on the battlefield when you gained life. It doesn't care if you also lost life,
//     even if you lost more life than you gained.

const TEXT =
  "At the beginning of your end step, if you gained 3 or more life this turn, create a 2/2 white Griffin creature token with flying.";

// Angelic Accord's intervening "if" on the turn's life gained.
export default defineCard({
  name: "Griffin Aerie",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 3 },
      targets: [],
      effect: { kind: "create-token", token: "Griffin Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
