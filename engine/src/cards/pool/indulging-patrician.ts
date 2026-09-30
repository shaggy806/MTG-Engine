import { defineCard } from "../define.js";

const TEXT = "At the beginning of your end step, if you gained 3 or more life this turn, each opponent loses 3 life.";

export default defineCard({
  name: "Indulging Patrician",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 1,
  toughness: 4,
  keywords: ["flying", "lifelink"],
  text: `Flying\nLifelink (Damage dealt by this creature also causes you to gain that much life.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 3 },
      targets: [],
      effect: { kind: "lose-life", amount: 3, who: "each-opponent" },
      resolve: null,
      text: TEXT,
    },
  ],
});
