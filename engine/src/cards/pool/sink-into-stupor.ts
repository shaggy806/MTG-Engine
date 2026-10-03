import { defineCard } from "../define.js";

// A modal double-faced card; Soporific Springs is its land back face. One
// target slot that takes either an opponent's spell or an opponent's nonland
// permanent (`spell-or-permanent`). Of the two returns, only the one from
// the zone the target is in does anything. A spell returned isn't countered,
// so it works on one that can't be; a copy of a spell ceases to exist (the
// rulings).
export default defineCard({
  name: "Sink into Stupor",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target spell or nonland permanent an opponent controls to its owner's hand.",
  targets: [{ kind: "spell-or-permanent", whose: "opponent", filter: { notTypes: ["land"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0, from: "stack" },
      { kind: "return-to-hand", target: 0 },
    ],
  },
  faces: ["Sink into Stupor", "Soporific Springs"],
});
