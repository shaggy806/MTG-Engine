import { defineCard } from "../define.js";

// EDHREC rank 2570.
//
// Rulings:
//   [2017-09-29] If you control a second Angrath's Marauders, damage dealt by sources you control
//     will be multiplied by 4. If you control a third, it will be multiplied by 8, and so on.
//   [2017-09-29] If an effect such as that of Chandra's Pyrohelix asks you to divide damage among
//     targets, you must divide the unmodified damage before doubling it.
//   [2017-09-29] If a creature with trample you control would deal combat damage to a blocking
//     creature while you control Angrath's Marauders, you must assign its unmodified damage.

const TEXT =
  "If a source you control would deal damage to a permanent or player, it deals double that damage to that permanent or player instead.";

export default defineCard({
  name: "Angrath's Marauders",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 4,
  toughness: 4,
  text: TEXT,
  // Fiery Emancipation's replacement, doubling rather than tripling.
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", multiplier: 2, source: { controlledBy: "you" } },
      text: TEXT,
    },
  ],
});
