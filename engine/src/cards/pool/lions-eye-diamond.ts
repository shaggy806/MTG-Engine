import { defineCard } from "../define.js";

const TEXT = "Discard your hand, Sacrifice this artifact: Add three mana of any one color. Activate only as an instant.";

// A mana ability that can't be activated mid-payment: its cost (discarding
// the hand) keeps it off the auto-payer, and an ability activated by hand is
// only ever offered to the player with priority — exactly when an instant
// could be cast. "Three mana of any one color" is `any-color` × 3: one
// colour, the payer's pick.
export default defineCard({
  name: "Lion's Eye Diamond",
  manaCost: "{0}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: false, discardHand: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 3 },
      resolve: null,
      text: TEXT,
    },
  ],
});
