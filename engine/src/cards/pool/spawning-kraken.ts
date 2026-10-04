import { defineCard } from "../define.js";

// EDHREC rank 4088.
// Makes Kraken → new token "Kraken Token (Spawning Kraken)".
// One trigger per matching creature that deals combat damage to a player
// (Sharding Sphinx's shape) — Spawning Kraken itself included.

const TEXT =
  "Whenever a Kraken, Leviathan, Octopus, or Serpent you control deals combat damage to a player, create a 9/9 blue Kraken creature token.";

export default defineCard({
  name: "Spawning Kraken",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 6,
  toughness: 6,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { subtypes: ["Kraken", "Leviathan", "Octopus", "Serpent"] },
      },
      targets: [],
      effect: { kind: "create-token", token: "Kraken Token (Spawning Kraken)", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
