import { defineCard } from "../define.js";

// EDHREC rank 1406. Choosing the same creature again is still choosing it
// (the ruling) — a `ring-tempts` trigger that a temptation with no creature
// to choose doesn't fire.
const UPKEEP = "At the beginning of your upkeep, the Ring tempts you.";
const CHOOSE = "Whenever you choose a creature as your Ring-bearer, you may pay 2 life. If you do, draw a card.";

export default defineCard({
  name: "Call of the Ring",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${UPKEEP}\n${CHOOSE}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "the-ring-tempts-you" },
      resolve: null,
      text: UPKEEP,
    },
    {
      trigger: { on: "ring-tempts", who: "you", chosen: true },
      targets: [],
      effect: { kind: "may", prompt: "Pay 2 life to draw a card?", costLife: 2, effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: CHOOSE,
    },
  ],
});
