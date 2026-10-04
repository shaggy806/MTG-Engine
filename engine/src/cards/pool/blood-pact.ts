import { defineCard } from "../define.js";

// EDHREC rank 3413.

// Sign in Blood's effect, at instant speed.
export default defineCard({
  name: "Blood Pact",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target player draws two cards and loses 2 life.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2, target: 0 },
      { kind: "lose-life", amount: 2, target: 0 },
    ],
  },
});
