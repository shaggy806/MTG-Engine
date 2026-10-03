import { defineCard } from "../define.js";

// Two targets controlled by different players (`differentController`): as
// it resolves, two one player controls are both illegal and nothing returns;
// one gone illegal still lends its controller, as it last existed, to that
// check (the rulings). The two return together.
export default defineCard({
  name: "Run Away Together",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Choose two target creatures controlled by different players. Return those creatures to their owners' hands.",
  targets: ["creature", { kind: "other", of: "creature", than: { slot: 0 }, differentController: true }],
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "return-to-hand", target: 0 },
      { kind: "return-to-hand", target: 1 },
    ],
  },
});
