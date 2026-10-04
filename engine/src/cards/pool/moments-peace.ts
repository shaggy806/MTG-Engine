import { defineCard } from "../define.js";

// EDHREC rank 5759.
//
// Rulings:
//   [2021-03-19] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2021-03-19] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.
//   [2021-03-19] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.
//   [2021-03-19] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2021-03-19] "Flashback [cost]" means "You may cast this card from your graveyard by paying
//     [cost] rather than paying its mana cost" and "If the flashback cost was paid, exile this
//     card instead of putting it anywhere else any time it would leave the stack."
//   [2021-03-19] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.

export default defineCard({
  name: "Moment's Peace",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  flashback: { cost: "{2}{G}" },
  text: "Prevent all combat damage that would be dealt this turn.\nFlashback {2}{G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "prevent-all-combat-damage" },
});
