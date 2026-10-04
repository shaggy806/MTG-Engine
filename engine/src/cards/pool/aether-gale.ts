import { distinctTargets } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 3675.
//
// Rulings:
//   [2014-11-07] You must choose six different legal targets in order to cast Aether Gale. If
//     some, but not all, of those targets become illegal before Aether Gale resolves, the
//     remaining legal targets will be put into their owners' hands.
//
// Six distinct, required slots; one instruction, so they leave together
// (Baral's Expertise's shape).
export default defineCard({
  name: "Aether Gale",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return six target nonland permanents to their owners' hands.",
  targets: distinctTargets(6, "nonland-permanent"),
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "return-to-hand", target: 0 },
      { kind: "return-to-hand", target: 1 },
      { kind: "return-to-hand", target: 2 },
      { kind: "return-to-hand", target: 3 },
      { kind: "return-to-hand", target: 4 },
      { kind: "return-to-hand", target: 5 },
    ],
  },
});
