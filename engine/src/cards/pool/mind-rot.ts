import { defineCard } from "../define.js";

export default defineCard({
  name: "Mind Rot",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target player discards two cards.",
  targets: ["player"],
  effect: { kind: "discard", target: 0, amount: 2 },
});
