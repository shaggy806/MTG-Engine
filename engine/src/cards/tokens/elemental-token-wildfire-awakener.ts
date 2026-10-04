import { defineCard } from "../define.js";

// Wildfire Awakener's Elemental token.

const TAP_TEXT = "Whenever this creature becomes tapped, it deals 1 damage to target player.";

export default defineCard({
  name: "Elemental Token (Wildfire Awakener)",
  art: "e4c5edb6-58be-4e61-9c3a-699816f9160f",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 1,
  toughness: 1,
  text: TAP_TEXT,
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "self" },
      targets: ["player"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
});
