import { defineCard } from "../define.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, exile the top card of your library. You may play that card this turn.";

// Played by the normal rules: costs paid, timing followed, a land only with a
// land play left (the ruling).
export default defineCard({
  name: "Count on Luck",
  manaCost: "{R}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: UPKEEP_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
