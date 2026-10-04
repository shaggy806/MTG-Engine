import { defineCard } from "../define.js";

// EDHREC rank 2432.
//
// Rulings:
//   [2020-08-07] Master Transmuter can be returned to its owner's hand to pay the cost of its
//     activated ability.
//   [2020-08-07] The artifact card you put onto the battlefield when the ability resolves may be
//     the same card that you returned to your hand when you paid the cost. If so, it returns to
//     the battlefield as a new object with no relation to its previous existence.
//
// The return is a `returnToHand` cost (Quirion Ranger's), paid as the ability
// goes on the stack, so the card returned is already in hand as it resolves;
// its filter doesn't leave out the source, so the Transmuter can return
// itself. "You may put" is Sneak Attack's `look-and-choose` from hand, min 0.
const TEXT =
  "{U}, {T}, Return an artifact you control to its owner's hand: You may put an artifact card from your hand onto the battlefield.";

export default defineCard({
  name: "Master Transmuter",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{U}", tap: true, returnToHand: { count: 1, filter: { type: "artifact" } } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "artifact" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
