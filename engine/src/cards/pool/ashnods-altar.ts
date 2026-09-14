import { defineCard } from "../define.js";

// Not a mana ability: a non-self sacrifice cost needs a real choice the
// auto-payment scan doesn't make (AUTHORING §8), so it resolves on the stack
// like an ordinary activated ability.
export default defineCard({
  name: "Ashnod's Altar",
  manaCost: "{3}",
  types: ["artifact"],
  text: "Sacrifice a creature: Add {C}{C}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "Sacrifice a creature: Add {C}{C}.",
    },
  ],
});
