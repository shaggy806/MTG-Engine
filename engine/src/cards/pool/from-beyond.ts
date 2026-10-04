import { defineCard } from "../define.js";

// EDHREC rank 4906.
// Makes Eldrazi Scion → "Eldrazi Scion Token".
//
// Rulings:
//   [2015-08-25] A card with devoid is just colorless. It's not colorless and the colors of mana
//     in its mana cost. (Devoid is `colors: []`.)
//   [2015-08-25] Sacrificing an Eldrazi Scion creature token to add {C} is a mana ability. It
//     doesn't use the stack and can't be responded to.
//   [2015-08-25] An Eldrazi card is one with the creature type Eldrazi. Just having "Eldrazi" in
//     its name or being an Eldrazi-themed card doesn't count.
//   [2015-08-25] Eldrazi and Scion are each separate creature types. Anything that affects Eldrazi
//     will affect these tokens, for example.

const UPKEEP_TEXT =
  "At the beginning of your upkeep, create a 1/1 colorless Eldrazi Scion creature token. It has \"Sacrifice this token: Add {C}.\"";
const SEARCH_TEXT =
  "{1}{G}, Sacrifice this enchantment: Search your library for an Eldrazi card, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "From Beyond",
  manaCost: "{3}{G}",
  colors: [],
  types: ["enchantment"],
  text: `Devoid (This card has no color.)\n${UPKEEP_TEXT}\n${SEARCH_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Eldrazi" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Scion Token", count: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
