import { defineCard } from "../define.js";

// EDHREC rank 5148.
// Scourge of Fleets' shape over every creature: the Island count is read as
// the spell resolves.

export default defineCard({
  name: "Engulf the Shore",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return to their owners' hands all creatures with toughness less than or equal to the number of Islands you control.",
  effect: {
    kind: "return-to-hand-all",
    filter: {
      type: "creature",
      toughness: { op: "lte", n: { amount: { countOf: { subtype: "Island", controlledBy: "you" } } } },
    },
  },
});
