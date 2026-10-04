import { defineCard } from "../define.js";

// EDHREC rank 3861.
//
// Rulings:
//   [2021-09-24] If you cast Rite of Oblivion using flashback, you must still pay its additional
//     cost of sacrificing a nonland permanent.
//   [2025-06-06] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2025-06-06] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.
//   [2025-06-06] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.
//   [2025-06-06] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2025-06-06] "Flashback [cost]" means "You may cast this card from your graveyard if the
//     resulting spell is an instant or sorcery spell by paying [cost] rather than paying its mana
//     cost" and "If the flashback cost was paid, exile this card instead of putting it anywhere
//     else any time it would leave the stack."
//   [2025-06-06] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.

export default defineCard({
  name: "Rite of Oblivion",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  flashback: { cost: "{2}{W}{B}" },
  text: "As an additional cost to cast this spell, sacrifice a nonland permanent.\nExile target nonland permanent.\nFlashback {2}{W}{B} (You may cast this card from your graveyard for its flashback cost and any additional costs. Then exile it.)",
  // Paid on a flashback cast too (the ruling), as Laughing Mad's discard is.
  additionalCost: { sacrifice: { notTypes: ["land"], controlledBy: "you" } },
  targets: ["nonland-permanent"],
  effect: { kind: "exile", target: 0 },
});
