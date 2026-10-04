import { defineCard } from "../define.js";

// EDHREC rank 4726.

const SEARCH_TEXT =
  "When this creature enters, you may search your library for up to two artifact, creature, and/or enchantment cards with mana value 1 or less, reveal them, put them into your hand, then shuffle.";

export default defineCard({
  name: "Brightglass Gearhulk",
  manaCost: "{G}{G}{W}{W}",
  colors: ["W", "G"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike", "trample"],
  text: `First strike, trample\n${SEARCH_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for up to two artifact, creature, and/or enchantment cards with mana value 1 or less?",
        effect: {
          kind: "search-library",
          filter: { typesAnyOf: ["artifact", "creature", "enchantment"], manaValue: { op: "lte", n: 1 } },
          destination: "hand",
          min: 0,
          max: 2,
          reveal: true,
        },
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
