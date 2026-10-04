import { defineCard } from "../define.js";

// EDHREC rank 2782.
//
// Rulings:
//   [2020-08-07] You may sacrifice Time Sieve as one of the artifacts to pay the cost of its own
//     ability.
// A sacrifice of several (Sai, Master Thopterist's shape) without `otherOnly`,
// so Time Sieve itself is one of the five it may pay with.
const TEXT = "{T}, Sacrifice five artifacts: Take an extra turn after this one.";

export default defineCard({
  name: "Time Sieve",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" }, count: 5 } },
      targets: [],
      effect: { kind: "take-extra-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
