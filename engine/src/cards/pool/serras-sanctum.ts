import { defineCard } from "../define.js";

// EDHREC rank 3047.
//
// Gaea's Cradle's shape: a live-amount mana ability.
export default defineCard({
  name: "Serra's Sanctum",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {W} for each enchantment you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "W",
        amount: { countOf: { type: "enchantment", controlledBy: "you" } },
      },
      resolve: null,
      text: "{T}: Add {W} for each enchantment you control.",
    },
  ],
});
