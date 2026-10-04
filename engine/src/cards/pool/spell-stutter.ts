import { defineCard } from "../define.js";

// EDHREC rank 4041.

export default defineCard({
  name: "Spell Stutter",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {2} plus an additional {1} for each Faerie you control.",
  targets: ["spell"],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [
      {
        payGeneric: { sum: [2, { countOf: { subtype: "Faerie", controlledBy: "you" } }] },
        text: "Pay {2} plus {1} for each Faerie Spell Stutter's controller controls.",
      },
    ],
    otherwise: { kind: "counter", target: 0 },
  },
});
