import { defineCard } from "../define.js";

// EDHREC rank 3150.
//
// A choice between two whole additional costs (Bone Shards' shape): each is its own castable
// variant, and exactly one is paid. The mana branch adds {3}{B} to the cost (Redirect
// Lightning's shape).

export default defineCard({
  name: "Eaten Alive",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a creature or pay {3}{B}.\nExile target creature or planeswalker.",
  additionalCost: {
    options: [
      { text: "Sacrifice a creature", sacrifice: { type: "creature", controlledBy: "you" } },
      { text: "Pay {3}{B}", mana: "{3}{B}" },
    ],
  },
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "exile", target: 0 },
});
