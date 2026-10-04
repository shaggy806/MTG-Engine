import { defineCard } from "../define.js";

// EDHREC rank 3889.
//
// Rulings:
//   [2025-06-06] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.
//   [2025-06-06] The creature is the source of the damage, not Nibelheim Aflame. For example,
//     Nibelheim Aflame can have a white creature deal damage to a creature with protection from
//     red.
//   [2025-06-06] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2025-06-06] "Flashback [cost]" means "You may cast this card from your graveyard if the
//     resulting spell is an instant or sorcery spell by paying [cost] rather than paying its mana
//     cost" and "If the flashback cost was paid, exile this card instead of putting it anywhere
//     else any time it would leave the stack."
//   [2025-06-06] Use the power of the target creature as Nibelheim Aflame resolves to determine
//     how much damage it deals to each other creature.
//   [2025-06-06] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2025-06-06] If the target creature is an illegal target as Nibelheim Aflame tries to resolve,
//     it won't resolve and none of its effects will happen. No damage will be dealt, and you won't
//     discard and draw even if you cast Nibelheim Aflame from a graveyard.
//   [2025-06-06] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2025-06-06] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.

const TEXT =
  "Choose target creature you control. It deals damage equal to its power to each other creature. If this spell was cast from a graveyard, discard your hand and draw four cards.";

// The creature is the source of the damage (the ruling), dealing its power as
// the spell resolves; if it's an illegal target by then, nothing happens.
export default defineCard({
  name: "Nibelheim Aflame",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{5}{R}{R}" },
  text: `${TEXT}\nFlashback {5}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)`,
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "damage-all",
        filter: { type: "creature" },
        amount: { powerOf: 0 },
        exceptSource: true,
        from: { target: 0 },
      },
      {
        kind: "conditional",
        condition: { kind: "source", filter: { castFrom: "graveyard" } },
        then: {
          kind: "sequence",
          effects: [
            { kind: "discard-hand", who: "you" },
            { kind: "draw", amount: 4 },
          ],
        },
      },
    ],
  },
});
