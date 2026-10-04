import { defineCard } from "../define.js";

// EDHREC rank 2636.
//
// Rulings:
//   [2017-04-18] Throne of the God-Pharaoh's ability triggers at the beginning of each of your end
//     steps, even if you control no tapped creatures. The number of tapped creatures you control
//     is checked as the ability resolves.

const TEXT =
  "At the beginning of your end step, each opponent loses life equal to the number of tapped creatures you control.";

export default defineCard({
  name: "Throne of the God-Pharaoh",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "lose-life",
        amount: { countOf: { type: "creature", controlledBy: "you", tapped: true } },
        who: "each-opponent",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
