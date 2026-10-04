import { defineCard } from "../define.js";

// EDHREC rank 3030.
//
// Rulings:
//   [2024-01-12] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying (such as an overload cost), add any cost increases, then apply any cost
//     reductions. The mana value of the spell remains unchanged, no matter what the total cost to
//     cast it was.
//   [2024-01-12] If you don't pay the overload cost of a spell with overload, that spell will have
//     a single target. If you pay the overload cost, the spell won't have any targets.
//   [2024-01-12] Note that if the spell with overload is dealing damage, protection from that
//     spell's color will still prevent that damage.
//   [2024-01-12] Because a spell with overload doesn't target when its overload cost is paid, it
//     may affect permanents with hexproof or with protection from the appropriate color.
//   [2024-01-12] If you are instructed to cast a spell with overload "without paying its mana
//     cost," you can't choose to pay its overload cost instead.
//
// Cyclonic Rift's overload shape; "each creature you don't control" is Blazing Volley's
// `damage-all` filter.

export default defineCard({
  name: "Mizzium Mortars",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Mizzium Mortars deals 4 damage to target creature you don't control.\nOverload {3}{R}{R}{R} (You may cast this spell for its overload cost. If you do, change \"target\" in its text to \"each.\")",
  targets: ["creature-an-opponent-controls"],
  effect: { kind: "damage", amount: 4, target: 0 },
  overload: {
    cost: "{3}{R}{R}{R}",
    effect: { kind: "damage-all", amount: 4, filter: { type: "creature", controlledBy: "opponent" } },
  },
});
