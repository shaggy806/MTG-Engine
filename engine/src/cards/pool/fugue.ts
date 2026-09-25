import { defineCard } from "../define.js";

export default defineCard({
  name: "Fugue",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target player discards three cards.",
  targets: ["player"],
  effect: { kind: "discard", target: 0, amount: 3 },
});
