import { defineCard } from "../define.js";

const CYCLE_TEXT = "When you cycle this card, each opponent mills four cards.";

// The cycle trigger resolves before the cycling ability's draw (the
// rulings).
export default defineCard({
  name: "Fractured Sanity",
  manaCost: "{U}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  cycling: { cost: "{1}{U}" },
  text: `Each opponent mills fourteen cards.\nCycling {1}{U} ({1}{U}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  effect: { kind: "mill", target: "each-opponent", amount: 14 },
  triggered: [
    {
      trigger: { on: "this-cycled" },
      targets: [],
      effect: { kind: "mill", target: "each-opponent", amount: 4 },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
