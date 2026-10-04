import { defineCard } from "../define.js";

// EDHREC rank 5927.

export default defineCard({
  name: "Fanatical Devotion",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Sacrifice a creature: Regenerate target creature.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: "Sacrifice a creature: Regenerate target creature.",
    },
  ],
});
