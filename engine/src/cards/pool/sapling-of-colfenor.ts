import { defineCard } from "../define.js";

// EDHREC rank 6703.
//
// Rulings:
//   - The ability is three sequential events: you gain the life, then lose
//     the life, then put the card into your hand.
//   - A revealed card that isn't a creature card stays on top of the library.
//   - A "*" power or toughness is read by its characteristic-defining ability
//     while the card is still in the library (it works in every zone).
//
// Thrasios's shape: `reveal-top` makes the top card target 0, and a
// `conditional` asks whether it's a creature card. The life changes read its
// toughness and power where it is — still on top of the library — and only
// then is it taken: the top card, which nothing in this resolution has
// moved, put into the hand (Coiling Oracle's one-card look, `min: 1`), so a
// card whose "*" counts the cards in your hand is read before it joins them.
const TEXT =
  "Whenever Sapling of Colfenor attacks, reveal the top card of your library. If it's a creature card, you gain life equal to that card's toughness, lose life equal to its power, then put it into your hand.";

export default defineCard({
  name: "Sapling of Colfenor",
  manaCost: "{3}{B/G}{B/G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Treefolk", "Shaman"],
  power: 2,
  toughness: 5,
  keywords: ["indestructible"],
  text: `Indestructible\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "reveal-top",
        then: {
          kind: "conditional",
          condition: { kind: "target", index: 0, filter: { type: "creature" } },
          then: {
            kind: "sequence",
            effects: [
              { kind: "gain-life", amount: { toughnessOf: 0 } },
              { kind: "lose-life", who: "you", amount: { powerOf: 0 } },
              {
                kind: "look-and-choose",
                zone: "library",
                count: 1,
                min: 1,
                max: 1,
                destination: "hand",
                leftover: "stay",
              },
            ],
          },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
