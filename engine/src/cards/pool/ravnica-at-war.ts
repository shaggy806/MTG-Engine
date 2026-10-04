import { defineCard } from "../define.js";

// EDHREC rank 4795.
//
// Rulings:
//   [2019-05-03] A land normally has no color, even if it can produce multiple colors of mana.

export default defineCard({
  name: "Ravnica at War",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Exile all multicolored permanents.",
  effect: { kind: "exile-all", filter: { multicolored: true } },
});
