import { defineCard } from "../define.js";

export default defineCard({
  name: "Staff of Nin",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: "At the beginning of your upkeep, draw a card.\n{T}: This artifact deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This artifact deals 1 damage to any target.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, draw a card.",
    },
  ],
});
