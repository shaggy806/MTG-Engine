import { defineCard } from "../define.js";

// EDHREC rank 5553.
// Makes Dragon Elemental → new token "Dragon Elemental Token".
//
// Rulings:
//   [2024-04-12] A copy of a spell can be countered like any other spell, but it must be countered
//     individually. Countering a spell with storm won’t affect the copies.
//   [2024-04-12] Spells cast from zones other than a player’s hand and spells that were countered
//     or otherwise failed to resolve are counted by the storm ability.
//   [2024-04-12] The copies of Elemental Eruption created by its storm ability are put directly
//     onto the stack. They aren’t cast and won’t be counted by other spells with storm cast later
//     in the turn.

export default defineCard({
  name: "Elemental Eruption",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Create a 4/4 red Dragon Elemental creature token with flying and prowess.\nStorm (When you cast this spell, copy it for each spell cast before it this turn.)",
  effect: { kind: "create-token", token: "Dragon Elemental Token", count: 1 },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm (When you cast this spell, copy it for each spell cast before it this turn.)",
    },
  ],
});
