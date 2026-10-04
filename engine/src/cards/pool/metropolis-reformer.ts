import { defineCard } from "../define.js";

// EDHREC rank 4712.

const HEXPROOF_TEXT = "You have hexproof.";
const LIFE_TEXT = "Whenever this creature is dealt damage, you gain that much life.";

export default defineCard({
  name: "Metropolis Reformer",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel", "Cleric"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${HEXPROOF_TEXT}\n${LIFE_TEXT}`,
  static: [{ affects: { scope: "self" }, playerHexproof: true, text: HEXPROOF_TEXT }],
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: { triggerValue: true } },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
