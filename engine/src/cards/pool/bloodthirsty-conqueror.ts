import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent loses life, you gain that much life. (Damage causes loss of life.)";

export default defineCard({
  name: "Bloodthirsty Conqueror",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "deathtouch"],
  text: `Flying, deathtouch\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "loses-life", who: "opponent" },
      targets: [],
      effect: { kind: "gain-life", amount: { triggerValue: true } },
      resolve: null,
      text: TEXT,
    },
  ],
});
