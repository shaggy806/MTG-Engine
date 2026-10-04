import { defineCard } from "../define.js";

// EDHREC rank 4731.
// Makes Food → use "Food Token".
//
// Rulings:
//   [2019-10-04] A permanent card is an artifact, creature, enchantment, land, or planeswalker
//     card.
//   [2019-10-04] While resolving the second triggered ability, you can't pay {1} multiple times to
//     look at more cards.
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token.

const FOOD_TEXT = "When this enchantment enters, create a Food token.";
const LOOK_TEXT =
  "Whenever you sacrifice a Food, you may pay {1}. If you do, look at the top two cards of your library. You may reveal a permanent card from among them and put it into your hand. Put the rest on the bottom of your library in any order.";

export default defineCard({
  name: "Trail of Crumbs",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `When this enchantment enters, create a Food token. (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")\n${LOOK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: FOOD_TEXT,
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Food" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to look at the top two cards of your library?",
        cost: "{1}",
        effect: {
          kind: "look-and-choose",
          zone: "library",
          count: 2,
          reveal: "chosen",
          min: 0,
          max: 1,
          filter: { notTypes: ["instant", "sorcery"] },
          destination: "hand",
          leftover: "bottom-any-order",
        },
      },
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
});
