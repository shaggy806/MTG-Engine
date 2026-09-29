import { defineCard } from "../define.js";

const UPKEEP_TEXT = "At the beginning of your upkeep, scry 1.";
const CAST_TEXT = "Whenever you cast a creature spell, you may pay {G}. If you do, draw a card.";

export default defineCard({
  name: "Lifecrafter's Bestiary",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${UPKEEP_TEXT}\n${CAST_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "may", prompt: "Pay {G} to draw a card?", cost: "{G}", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
