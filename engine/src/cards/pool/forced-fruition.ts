import { defineCard } from "../define.js";

// EDHREC rank 2505.
//
// "That player" is the caster — the `trigger-controller` scope (Kambal,
// Consul of Allocation).
//
// Rulings:
//   [2007-10-01] Yes, the opponent draws seven cards. It's not optional.

const TEXT = "Whenever an opponent casts a spell, that player draws seven cards.";

export default defineCard({
  name: "Forced Fruition",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: { kind: "draw", who: "trigger-controller", amount: 7 },
      resolve: null,
      text: TEXT,
    },
  ],
});
