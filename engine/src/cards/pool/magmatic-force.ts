import { defineCard } from "../define.js";

// "At the beginning of **each** upkeep" — `who: "any"`, so it fires on every
// player's turn rather than only its controller's.
export default defineCard({
  name: "Magmatic Force",
  manaCost: "{5}{R}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 7,
  toughness: 7,
  text: "At the beginning of each upkeep, this creature deals 3 damage to any target.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "At the beginning of each upkeep, Magmatic Force deals 3 damage to any target.",
    },
  ],
});
