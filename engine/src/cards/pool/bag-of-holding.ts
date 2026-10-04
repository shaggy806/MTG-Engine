import { defineCard } from "../define.js";

// EDHREC rank 4039.
//
// Rulings:
//   [2019-07-12] If you discard a card but that card is not in your graveyard as Bag of Holding's
//     first ability resolves, that card remains wherever it has moved.
//   [2019-07-12] You both draw and discard while Bag of Holding's second ability is resolving. No
//     player may take any action—nor can anything else happen—until you've both drawn and
//     discarded.
//   [2019-07-12] If Bag of Holding is moved to exile when you sacrifice it (most likely due to
//     Leyline of the Void's effect), it remains in exile. It won't be returned to your hand.
//   [2019-07-12] If you control more than one Bag of Holding, you choose which one will hold the
//     discarded card. Other Bags of Holding can't return that card.
//   [2019-07-12] If Bag of Holding leaves the battlefield, the items it contained are exiled
//     forever (and, perhaps, scattered throughout the Astral Plane). If the same Bag of Holding
//     card returns to the battlefield, it's considered a new object without access to the cards
//     stored by the old object.

export default defineCard({
  name: "Bag of Holding",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "Whenever you discard a card, exile that card from your graveyard.\n{2}, {T}: Draw a card, then discard a card.\n{4}, {T}, Sacrifice this artifact: Return all cards exiled with this artifact to their owner's hand.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{2}, {T}: Draw a card, then discard a card.",
    },
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source", linked: "hand" },
      resolve: null,
      text: "{4}, {T}, Sacrifice this artifact: Return all cards exiled with this artifact to their owner's hand.",
    },
  ],
  triggered: [
    {
      trigger: { on: "discards", who: "you", perCard: true },
      targets: [],
      effect: { kind: "exile", target: "trigger-object", linked: true },
      resolve: null,
      text: "Whenever you discard a card, exile that card from your graveyard.",
    },
  ],
});
