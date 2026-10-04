import { defineCard } from "../define.js";

// EDHREC rank 2979.
//
// Rulings:
//   [2021-09-24] If the spell that's copied is modal (that is, it says "Choose one —" or the
//     like), the copy will have the same mode or modes. You can't choose different ones.
//   [2021-09-24] The copy will have the same targets as the spell it's copying unless you choose
//     new ones. You may change any number of the targets, including all of them or none of them.
//     The new targets must be legal.
//   [2021-09-24] If the spell that's copied has an X whose value was determined as it was cast,
//     the copy has the same value of X.
//   [2021-09-24] The copy that Galvanic Iteration's ability creates is created on the stack, so
//     it's not "cast." Abilities that trigger when a player casts a spell won't trigger.
//   [2021-09-24] Galvanic Iteration's ability will copy any instant or sorcery spell, not just one
//     with targets.
//   [2021-09-24] A copy is created even if the spell that caused Galvanic Iteration's ability to
//     trigger has been countered by the time that ability resolves. The copy resolves before the
//     original spell.
//   [2021-09-24] If you resolve one Galvanic Iteration after another (or cast the same one with
//     flashback), the second Galvanic Iteration will be copied. That copy and spell each resolve,
//     creating two delayed triggered abilities. The next spell you cast after that will be copied
//     twice. If that spell is also a Galvanic Iteration, the following spell will be copied three
//     times, and so on.
//   [2021-09-24] You can't choose to pay any additional costs for the copy. However, effects based
//     on any additional costs that were paid for the original spell are copied as though those
//     same costs were paid for the copy too.
//   [2025-06-06] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2025-06-06] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2025-06-06] "Flashback [cost]" means "You may cast this card from your graveyard if the
//     resulting spell is an instant or sorcery spell by paying [cost] rather than paying its mana
//     cost" and "If the flashback cost was paid, exile this card instead of putting it anywhere
//     else any time it would leave the stack."
//   [2025-06-06] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2025-06-06] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.
//   [2025-06-06] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.

export default defineCard({
  name: "Galvanic Iteration",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  flashback: { cost: "{1}{U}{R}" },
  text: "When you next cast an instant or sorcery spell this turn, copy that spell. You may choose new targets for the copy.\nFlashback {1}{U}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  // Twinferno's delayed trigger: the copy keeps the spell's modes, X and paid
  // costs, and is made from the spell as it last was even if it was countered.
  effect: {
    kind: "delayed-trigger",
    at: { nextSpell: { typesAnyOf: ["instant", "sorcery"] } },
    effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
    text: "Copy that spell. You may choose new targets for the copy.",
  },
});
