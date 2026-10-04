import { defineCard } from "../define.js";

// EDHREC rank 5940.
//
// Rulings:
//   [2017-11-17] You scry 2 even if the spell’s controller pays {X}.
//   [2017-11-17] You must be able to target another spell to cast Condescend. Condescend can’t
//     target itself.
//
// Syncopate's `unless` with this spell's X, then the scry whichever way the
// choice went.
export default defineCard({
  name: "Condescend",
  manaCost: "{X}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {X}. Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "unless",
        chooser: 0,
        options: [{ payGeneric: "x", text: "Pay {X}." }],
        otherwise: { kind: "counter", target: 0 },
      },
      { kind: "scry", amount: 2 },
    ],
  },
});
