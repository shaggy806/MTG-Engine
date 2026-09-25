import { defineCard } from "../define.js";

export default defineCard({
  name: "Sinister Monolith",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["artifact"],
  text: "At the beginning of combat on your turn, each opponent loses 1 life and you gain 1 life.\n{T}, Pay 2 life, Sacrifice this artifact: Draw two cards. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 2, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{T}, Pay 2 life, Sacrifice this artifact: Draw two cards. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "At the beginning of combat on your turn, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
