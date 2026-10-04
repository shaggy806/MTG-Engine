import { defineCard } from "../define.js";

// Weapons Manufacturing's Munitions token.

export default defineCard({
  name: "Munitions Token",
  art: "a16f931a-9fa3-45b1-8d54-04b6b5bf7b71",
  colors: [],
  types: ["artifact"],
  text: "When this token leaves the battlefield, it deals 2 damage to any target.",
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "When this token leaves the battlefield, it deals 2 damage to any target.",
    },
  ],
});
