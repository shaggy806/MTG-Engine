import { defineCard } from "../define.js";

// Top-commanders rank 100. X is the `life-gained` turn stat, read as the
// trigger resolves — so life gained in response still counts — and each
// opponent mills it, APNAP (a `mill` with a player scope).
const END_STEP_TEXT =
  "At the beginning of your end step, each opponent mills X cards, where X is the amount of " +
  "life you gained this turn.";

export default defineCard({
  name: "Hope Estheim",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: `Lifelink\n${END_STEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "mill",
        target: "each-opponent",
        amount: { turnStat: "life-gained" },
      },
      resolve: null,
      text: END_STEP_TEXT,
    },
  ],
});
