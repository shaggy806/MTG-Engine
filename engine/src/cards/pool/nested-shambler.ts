import { defineCard } from "../define.js";

// EDHREC rank 4134.
//
// Rulings:
//   [2021-06-18] X is Nested Shambler's power the last time it was on the battlefield, not its
//     power in the graveyard. If its power was 0 or less when it died, you won't create any
//     tokens.

const TEXT =
  "When this creature dies, create X tapped 1/1 green Squirrel creature tokens, where X is this creature's power.";

export default defineCard({
  name: "Nested Shambler",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      // `powerOf: "source"` from a dies trigger reads last-known information
      // (the ruling; Elenda's Hierophant's shape).
      effect: { kind: "create-token", token: "Squirrel Token", count: { powerOf: "source" }, tapped: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
