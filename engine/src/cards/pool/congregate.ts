import { defineCard } from "../define.js";

// EDHREC rank 5280.
//
// Rulings:
//   [2022-12-08] Count the number of creatures as Congregate resolves to determine how much life
//     is gained.

const TEXT = "Target player gains 2 life for each creature on the battlefield.";

// "Target player gains" is Kenrith's `toControllerOfTarget` on a player slot;
// every creature on the battlefield, whoever controls it, counted as it
// resolves (the ruling).
export default defineCard({
  name: "Congregate",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["instant"],
  text: TEXT,
  targets: ["player"],
  effect: {
    kind: "gain-life",
    amount: { countOf: { type: "creature" }, times: 2 },
    toControllerOfTarget: 0,
  },
});
