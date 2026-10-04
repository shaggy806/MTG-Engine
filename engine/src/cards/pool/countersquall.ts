import { defineCard } from "../define.js";

// EDHREC rank 3505.
//
// Rulings:
//   [2018-12-07] A spell that can’t be countered is a legal target for Countersquall. The spell
//     won’t be countered when Countersquall resolves, but its controller still loses 2 life.

export default defineCard({
  name: "Countersquall",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["instant"],
  text: "Counter target noncreature spell. Its controller loses 2 life.",
  targets: ["noncreature-spell"],
  // Undermine's shape: the life loss is read off the target, so it still
  // happens when the spell can't be countered (the ruling).
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "lose-life", amount: 2, toControllerOfTarget: 0 },
    ],
  },
});
