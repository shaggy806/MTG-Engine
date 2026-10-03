import { defineCard } from "../define.js";

// "Cast spells", so a land exiled this way stays put; each card is castable
// this turn only, at its normal timing (the rulings), and the any-colour
// spending is only for a spell cast this way (rule 118.14).
const UPKEEP_TEXT =
  "At the beginning of your upkeep, exile the top card of each opponent's library. Until end of turn, you may cast spells from among those exiled cards, and you may spend mana as though it were mana of any color to cast those spells.";

export default defineCard({
  name: "Stolen Strategy",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: UPKEEP_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        whose: "each-opponent",
        duration: "end-of-turn",
        castOnly: true,
        spendAs: "any-color",
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
