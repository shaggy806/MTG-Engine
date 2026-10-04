import { defineCard } from "../define.js";

// EDHREC rank 3886.
//
// Rulings:
//   [2024-06-07] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2024-06-07] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2024-06-07] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2024-06-07] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.
//   [2024-06-07] "Flashback [cost]" means "You may cast this card from your graveyard by paying
//     [cost] rather than paying its mana cost" and "If the flashback cost was paid, exile this
//     card instead of putting it anywhere else any time it would leave the stack."

export default defineCard({
  name: "Eviscerator's Insight",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  flashback: { cost: "{4}{B}" },
  text: "As an additional cost to cast this spell, sacrifice an artifact or creature.\nDraw two cards.\nFlashback {4}{B} (You may cast this card from your graveyard for its flashback cost and any additional costs. Then exile it.)",
  additionalCost: { sacrifice: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" } },
  effect: { kind: "draw", amount: 2 },
});
