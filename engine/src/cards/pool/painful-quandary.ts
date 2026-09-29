import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent casts a spell, that player loses 5 life unless they discard a card.";

// It resolves before the spell does (the rulings).
export default defineCard({
  name: "Painful Quandary",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: {
        kind: "unless",
        chooser: "trigger-controller",
        options: [{ discard: 1, text: "Discard a card" }],
        otherwise: { kind: "lose-life", amount: 5, who: "trigger-controller" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
