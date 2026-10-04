import { defineCard } from "../define.js";

// EDHREC rank 3020.
//
// Rulings:
//   [2022-12-08] If multiple "extra turn" effects resolve in the same turn, take them in the
//     reverse of the order that the effects resolved. In other words, the most recently created
//     extra turn is taken first.
//
// Time Warp's `take-extra-turn`, twice: both turns are the same player's, so their order among
// themselves can't matter.
export default defineCard({
  name: "Time Stretch",
  manaCost: "{8}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player takes two extra turns after this one.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "take-extra-turn", target: 0 },
      { kind: "take-extra-turn", target: 0 },
    ],
  },
});
