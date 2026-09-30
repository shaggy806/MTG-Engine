import { defineCard } from "../define.js";

const TEXT = "Morbid — At the beginning of each end step, if a creature died this turn, you may draw a card.";

export default defineCard({
  name: "Deathreap Ritual",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "creature-died-this-turn" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
