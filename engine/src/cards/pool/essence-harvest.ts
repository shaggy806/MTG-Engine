import { defineCard } from "../define.js";

// EDHREC rank 6412.
//
// Rulings:
//   [2012-05-01] The value of X is determined when Essence Harvest resolves. If you control no
//     creatures that time, no life will be lost or gained.
//   [2012-05-01] Essence Harvest targets only the player. It doesn’t target any creatures. If that
//     player is an illegal target when Essence Harvest tries to resolve, it won’t resolve and none
//     of its effects will happen. No life will be lost or gained.

export default defineCard({
  name: "Essence Harvest",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target player loses X life and you gain X life, where X is the greatest power among creatures you control.",
  targets: ["player"],
  // X is read as it resolves (ruling); nothing changes the board between the two reads.
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "lose-life",
        amount: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
        target: 0,
      },
      {
        kind: "gain-life",
        amount: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
      },
    ],
  },
});
