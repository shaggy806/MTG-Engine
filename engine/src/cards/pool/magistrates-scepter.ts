import { defineCard } from "../define.js";

// EDHREC rank 5609.
//
// Rulings:
//   [2018-07-13] If multiple extra turns would be taken after this one, perhaps because more than
//     one player has activated the last ability of their Magistrate’s Scepter, the most recently
//     created one is taken first.

export default defineCard({
  name: "Magistrate's Scepter",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{4}, {T}: Put a charge counter on this artifact.\n{T}, Remove three charge counters from this artifact: Take an extra turn after this one.",
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: "{4}, {T}: Put a charge counter on this artifact.",
    },
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "charge", count: 3 } },
      targets: [],
      effect: { kind: "take-extra-turn" },
      resolve: null,
      text: "{T}, Remove three charge counters from this artifact: Take an extra turn after this one.",
    },
  ],
});
