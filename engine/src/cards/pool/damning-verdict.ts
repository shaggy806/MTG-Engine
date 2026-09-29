import { defineCard } from "../define.js";

export default defineCard({
  name: "Damning Verdict",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures with no counters on them.",
  effect: { kind: "destroy-all", filter: { type: "creature", counters: { compare: { op: "eq", n: 0 } } } },
});
