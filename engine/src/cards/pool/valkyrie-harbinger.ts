import { defineCard } from "../define.js";

// EDHREC rank 2825.
// Makes Angel → use "4/4 Vigilant Angel Token".
//
// Rulings:
//   [2021-02-05] If you haven't gained 4 life by the time an end step begins, Valkyrie Harbinger's
//     ability won't trigger at all.
//   [2021-02-05] You create just one Angel token, no matter how much life you've gained past 4
//     life.
//   [2021-02-05] Valkyrie Harbinger's ability looks at how much life you've gained in the turn,
//     even if it wasn't on the battlefield when you gained life. It doesn't care if you also lost
//     life, even if you lost more life than you gained.

const END_TEXT =
  "At the beginning of each end step, if you gained 4 or more life this turn, create a 4/4 white Angel creature token with flying and vigilance.";

export default defineCard({
  name: "Valkyrie Harbinger",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel", "Cleric"],
  power: 4,
  toughness: 5,
  keywords: ["flying", "lifelink"],
  text: `Flying\nLifelink (Damage dealt by this creature also causes you to gain that much life.)\n${END_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 4 },
      targets: [],
      effect: { kind: "create-token", token: "4/4 Vigilant Angel Token", count: 1 },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
