import { defineCard } from "../define.js";

export default defineCard({
  name: "Death Grasp",
  manaCost: "{X}{W}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text: "Death Grasp deals X damage to any target. You gain X life.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: "x", target: 0 }, { kind: "gain-life", amount: "x" }],
  },
});
