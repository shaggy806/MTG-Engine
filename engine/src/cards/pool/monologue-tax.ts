import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent casts their second spell each turn, you create a Treasure token.";

// Once each turn for each opponent; their first spell counts even if it was
// cast before Monologue Tax arrived, or was countered (the rulings).
export default defineCard({
  name: "Monologue Tax",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
