import { defineCard } from "../define.js";

// EDHREC rank 2439.
//
// Rulings:
//   [2024-06-07] The value of X is calculated only once, as Consuming Corruption resolves.
//   [2024-06-07] If the target creature or planeswalker is an illegal target as Consuming
//     Corruption tries to resolve, it won't resolve and none of its effects will happen. You won't
//     gain life.
//
// X is read by each step as it applies, back to back in one resolution with
// nothing between them that could change the Swamp count (state-based
// actions wait until the spell has finished), so it's the one value.
const SWAMPS = { countOf: { subtype: "Swamp", controlledBy: "you" } } as const;

export default defineCard({
  name: "Consuming Corruption",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Consuming Corruption deals X damage to target creature or planeswalker and you gain X life, where X is the number of Swamps you control.",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", target: 0, amount: SWAMPS },
      { kind: "gain-life", amount: SWAMPS },
    ],
  },
});
