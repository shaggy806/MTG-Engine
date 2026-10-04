import { defineCard } from "../define.js";

// EDHREC rank 5322.
//
// Rulings:
//   [2025-10-02] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2025-10-02] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2025-10-02] Earthbend doesn't give the land you control a color. As most lands are colorless,
//     in most cases the resulting land creature will also be colorless.
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."
//   [2025-10-02] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2025-10-02] If a land was animated by earthbend and would go to any zone other than the
//     graveyard or exile, it will not be returned to the battlefield by the delayed triggered
//     ability created by earthbend.
//   [2025-10-02] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.
//   [2025-10-02] The land will retain any other types, subtypes, or supertypes it previously had.
//     It will also retain any mana abilities it had as a result of those subtypes. For example, a
//     Forest that's turned into a creature this way can still be tapped for {G}.
//   [2025-10-02] "Flashback [cost]" means "You may cast this card from your graveyard by paying
//     [cost] rather than paying its mana cost" and "If the flashback cost was paid, exile this
//     card instead of putting it anywhere else any time it would leave the stack."
//   [2025-10-02] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.

export default defineCard({
  name: "Rockalanche",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  flashback: { cost: "{5}{G}" },
  text: "Earthbend X, where X is the number of Forests you control. (Target land you control becomes a 0/0 creature with haste that's still a land. Put X +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)\nFlashback {5}{G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["land-you-control"],
  effect: {
    kind: "earthbend",
    target: 0,
    amount: { countOf: { subtype: "Forest", controlledBy: "you" } },
  },
});
