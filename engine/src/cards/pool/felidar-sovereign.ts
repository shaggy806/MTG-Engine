import { defineCard } from "../define.js";

const UPKEEP = "At the beginning of your upkeep, if you have 40 or more life, you win the game.";

// An intervening-if (rule 603.4): checked as the upkeep begins and again as
// the trigger resolves, so life lost in response stops the win (the ruling).
// In Commander everyone starts at 40, which is the card.
export default defineCard({
  name: "Felidar Sovereign",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Beast"],
  power: 4,
  toughness: 6,
  keywords: ["vigilance", "lifelink"],
  text:
    "Vigilance (Attacking doesn't cause this creature to tap.)\n" +
    "Lifelink (Damage dealt by this creature also causes you to gain that much life.)\n" +
    UPKEEP,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "life-total", atLeast: 40 },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
