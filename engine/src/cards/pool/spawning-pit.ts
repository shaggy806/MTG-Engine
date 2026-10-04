import { defineCard } from "../define.js";

// EDHREC rank 4285.
// Makes a 2/2 colorless Spawn artifact creature → "Spawn Token (Spawning Pit)".

export default defineCard({
  name: "Spawning Pit",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "Sacrifice a creature: Put a charge counter on this artifact.\n{1}, Remove two charge counters from this artifact: Create a 2/2 colorless Spawn artifact creature token.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: "Sacrifice a creature: Put a charge counter on this artifact.",
    },
    {
      cost: { mana: "{1}", tap: false, removeCounter: { kind: "charge", count: 2 } },
      targets: [],
      effect: { kind: "create-token", token: "Spawn Token (Spawning Pit)", count: 1 },
      resolve: null,
      text: "{1}, Remove two charge counters from this artifact: Create a 2/2 colorless Spawn artifact creature token.",
    },
  ],
});
