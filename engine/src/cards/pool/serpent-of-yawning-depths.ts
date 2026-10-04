import { defineCard } from "../define.js";

// EDHREC rank 4629.
//
// Shifting Sliver's "can't be blocked except by" shape, over four creature
// types (a `subtypes` filter is an OR; `notSubtypes` has none of them).

const SEA = ["Kraken", "Leviathan", "Octopus", "Serpent"] as const;
const TEXT =
  "Krakens, Leviathans, Octopuses, and Serpents you control can't be blocked except by Krakens, Leviathans, Octopuses, and Serpents.";

export default defineCard({
  name: "Serpent of Yawning Depths",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["enchantment", "creature"],
  subtypes: ["Serpent"],
  power: 6,
  toughness: 6,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { controlledBy: "you", subtypes: SEA } },
      cantBeBlockedBy: { notSubtypes: SEA },
      text: TEXT,
    },
  ],
});
