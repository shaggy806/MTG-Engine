import { defineCard } from "../define.js";

// Historic is artifact, legendary or Saga (rule 700.6), so "not historic" is
// none of the three.
export default defineCard({
  name: "Desynchronization",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Return each nonland permanent that's not historic to its owner's hand. (Artifacts, legendaries, and Sagas are historic.)",
  effect: {
    kind: "return-to-hand-all",
    filter: { notTypes: ["land", "artifact"], notSupertype: "legendary", notSubtypes: ["Saga"] },
  },
});
