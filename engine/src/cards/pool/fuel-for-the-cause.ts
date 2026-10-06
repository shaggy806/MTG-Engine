import { defineCard } from "../define.js";

// An illegal target means the spell doesn't resolve and nothing is
// proliferated (the ruling, rule 608.2b). Atomize's shape.
export default defineCard({
  name: "Fuel for the Cause",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell, then proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: ["spell"],
  effect: { kind: "sequence", effects: [{ kind: "counter", target: 0 }, { kind: "proliferate" }] },
});
