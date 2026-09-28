import { defineCard } from "../define.js";

//
// Rulings:
//   [2025-07-25] If a card in your library has {X} in its mana cost, X is 0 for the purpose of
//     determining its mana value.

export default defineCard({
  name: "Starfield Shepherd",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, search your library for a basic Plains card or a creature card with mana value 1 or less, reveal it, put it into your hand, then shuffle.\nWarp {1}{W} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: {
          anyOf: [
            { supertype: "basic", subtype: "Plains" },
            { type: "creature", manaValue: { op: "lte", n: 1 } },
          ],
        },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, search your library for a basic Plains card or a creature card with mana value 1 or less, reveal it, put it into your hand, then shuffle.",
    },
  ],
  warp: { cost: "{1}{W}" },
});
