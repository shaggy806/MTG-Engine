import { defineCard } from "../define.js";

// EDHREC rank 5925.
// Makes Bird → new token "Bird Token (Gwaihir, Greatest of the Eagles)" (scaffolded).
//
// Rulings:
//   [2023-06-16] Gwaihir, Greatest of the Eagles's ability looks at how much life you've gained in
//     the turn, even if it wasn't on the battlefield when you gained life. It doesn't care if you
//     also lost life, even if you lost more life than you gained.
//   [2023-06-16] You create just one Bird token, no matter how much life you've gained past 3
//     life.
//   [2023-06-16] If you haven't gained 3 or more life by the time an end step begins, Gwaihir,
//     Greatest of the Eagles's ability won't trigger at all.

export default defineCard({
  name: "Gwaihir, Greatest of the Eagles",
  manaCost: "{4}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Noble"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhenever Gwaihir attacks, target attacking creature gains flying until end of turn.\nAt the beginning of each end step, if you gained 3 or more life this turn, create a 3/3 white Bird creature token with flying and \"Whenever this token attacks, target attacking creature gains flying until end of turn.\"",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever Gwaihir attacks, target attacking creature gains flying until end of turn.",
    },
    {
      // Angelic Accord's shape: an intervening "if" on the turn's life gained.
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 3 },
      targets: [],
      effect: { kind: "create-token", token: "Bird Token (Gwaihir, Greatest of the Eagles)", count: 1 },
      resolve: null,
      text: "At the beginning of each end step, if you gained 3 or more life this turn, create a 3/3 white Bird creature token with flying and \"Whenever this token attacks, target attacking creature gains flying until end of turn.\"",
    },
  ],
});
