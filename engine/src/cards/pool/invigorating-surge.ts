import { defineCard } from "../define.js";

// EDHREC rank 3587.
//
// Rulings:
//   [2020-06-23] To double the number of +1/+1 counters on a creature, put a number of +1/+1
//     counters on it equal to the number it already has. Other cards that interact with putting
//     counters on it will interact with this effect accordingly.

export default defineCard({
  name: "Invigorating Surge",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Put a +1/+1 counter on target creature you control, then double the number of +1/+1 counters on that creature.",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "double-counters", target: 0, counter: "+1/+1" },
    ],
  },
});
