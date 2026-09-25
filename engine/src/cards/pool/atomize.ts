import { defineCard } from "../define.js";

export default defineCard({
  name: "Atomize",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: "Destroy target nonland permanent. Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: ["nonland-permanent"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "proliferate" }] },
});
