import { defineCard } from "../define.js";

// EDHREC rank 2863.
//
// Rulings:
//   [2019-10-04] The triggered ability of Revenge of Ravens resolves before any abilities the
//     attacking player controls. If this causes the attacking player to lose the game, that
//     player's triggered abilities won't resolve and no combat damage will be dealt.

export default defineCard({
  name: "Revenge of Ravens",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever a creature attacks you or a planeswalker you control, that creature's controller loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "any", attackingYou: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          // "that creature's controller" — the attacker's, not a target.
          { kind: "lose-life", amount: 1, who: "trigger-controller" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever a creature attacks you or a planeswalker you control, that creature's controller loses 1 life and you gain 1 life.",
    },
  ],
});
