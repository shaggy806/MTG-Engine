import { defineCard } from "../define.js";

// EDHREC rank 5770.
//
// Rulings:
//   [2020-11-10] A player gaining control of a creature doesn't cause that player to gain control
//     of any Auras or Equipment attached to that creature.

export default defineCard({
  name: "Wrong Turn",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target opponent gains control of target creature. (If an attacking or blocking creature changes controllers, it's removed from combat.)",
  targets: ["opponent", "creature"],
  effect: { kind: "gain-control", target: 1, who: { target: 0 }, untilEndOfTurn: false },
});
