import { defineCard } from "../define.js";

// EDHREC rank 2502.
//
// Storm is Grapeshot's shape: a `this-cast` trigger whose `storm` effect
// copies the spell for each spell cast before it this turn (rule 702.40a).
//
// Rulings:
//   [2022-12-08] Spells cast from zones other than a player's hand and spells that were countered
//     are counted by the storm ability.
//   [2022-12-08] The copies are put directly onto the stack. They aren't cast and won't be counted
//     by other spells with storm cast later in the turn.

export default defineCard({
  name: "Empty the Warrens",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Create two 1/1 red Goblin creature tokens.\nStorm (When you cast this spell, copy it for each spell cast before it this turn.)",
  effect: { kind: "create-token", token: "Goblin Token", count: 2 },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm — when you cast this spell, copy it for each spell cast before it this turn.",
    },
  ],
});
