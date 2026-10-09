import { defineCard } from "../define.js";

// Miscast's counter for {1}, with Brain Freeze's storm: a copy for each spell
// cast before it this turn, by anyone, countered ones included, each asked
// for a new target one copy at a time (rule 702.40a, 707.10c; its rulings).
// Each copy's "its controller" is the controller of that copy's own target.
const COUNTER_TEXT = "Counter target instant or sorcery spell unless its controller pays {1}.";
const STORM_TEXT =
  "Storm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)";

export default defineCard({
  name: "Flusterstorm",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: `${COUNTER_TEXT}\n${STORM_TEXT}`,
  targets: [{ kind: "spell", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ pay: "{1}", text: "Pay {1}" }],
    otherwise: { kind: "counter", target: 0 },
  },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: STORM_TEXT,
    },
  ],
});
