import { defineCard } from "../define.js";

export default defineCard({
  name: "Diabolic Edict",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target player sacrifices a creature.",
  targets: ["player"],
  effect: {
    kind: "sacrifice",
    who: "target",
    filter: { type: "creature" },
    count: 1,
  },
});
