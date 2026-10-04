import { defineCard } from "../define.js";

// EDHREC rank 5266.
//
// Rulings:
//   [2016-11-08] If you win the flip, Boompile is destroyed along with all the other nonland
//     permanents.
//   [2016-11-08] You flip a coin as Boompile’s ability resolves. No player may take actions
//     between seeing the result of the flip and all nonland permanents being destroyed.

export default defineCard({
  name: "Boompile",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Flip a coin. If you win the flip, destroy all nonland permanents.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      // Boompile itself is destroyed along with the rest (the ruling).
      effect: { kind: "flip-coin", won: { kind: "destroy-all", filter: { notTypes: ["land"] } } },
      resolve: null,
      text: "{T}: Flip a coin. If you win the flip, destroy all nonland permanents.",
    },
  ],
});
