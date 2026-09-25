import { defineCard } from "../define.js";

export default defineCard({
  name: "Three Tragedies",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  subtypes: ["Arcane"],
  text: "Target player discards three cards.",
  targets: ["player"],
  effect: { kind: "discard", target: 0, amount: 3 },
});
