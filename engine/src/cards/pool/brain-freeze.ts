import { defineCard } from "../define.js";

// Storm counts every spell cast before it this turn, by any player, countered
// ones and ones cast from anywhere included; each copy may get a new target
// player, asked one copy at a time (the rulings).
export default defineCard({
  name: "Brain Freeze",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target player mills three cards.\nStorm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: 3 },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)",
    },
  ],
});
