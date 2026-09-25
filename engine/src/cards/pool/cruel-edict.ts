import { defineCard } from "../define.js";

export default defineCard({
  name: "Cruel Edict",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target opponent sacrifices a creature of their choice.",
  targets: ["opponent"],
  effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
});
