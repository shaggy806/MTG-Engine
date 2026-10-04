import { defineCard } from "../define.js";

// EDHREC rank 5690.
// Makes Golem → new token "Golem Token (Golem Foundry)" (scaffolded).
//
// Rulings:
//   [2011-01-01] Whenever you cast an artifact spell, Golem Foundry's first ability triggers and
//     goes on the stack on top of it. It will resolve before the artifact spell does.

export default defineCard({
  name: "Golem Foundry",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "Whenever you cast an artifact spell, you may put a charge counter on this artifact.\nRemove three charge counters from this artifact: Create a 3/3 colorless Golem artifact creature token.",
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "charge", count: 3 } },
      targets: [],
      effect: { kind: "create-token", token: "Golem Token (Golem Foundry)", count: 1 },
      resolve: null,
      text: "Remove three charge counters from this artifact: Create a 3/3 colorless Golem artifact creature token.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a charge counter on Golem Foundry?",
        effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      },
      resolve: null,
      text: "Whenever you cast an artifact spell, you may put a charge counter on this artifact.",
    },
  ],
});
