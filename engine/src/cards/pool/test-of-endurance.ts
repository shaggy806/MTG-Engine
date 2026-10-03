import { defineCard } from "../define.js";

const UPKEEP = "At the beginning of your upkeep, if you have 50 or more life, you win the game.";

// An intervening-if (rule 603.4): checked as the upkeep begins and again as
// the trigger resolves (the ruling).
export default defineCard({
  name: "Test of Endurance",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: UPKEEP,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "life-total", atLeast: 50 },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
