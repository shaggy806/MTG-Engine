import { defineCard } from "../define.js";

export default defineCard({
  name: "Deception",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target opponent discards two cards.",
  targets: ["opponent"],
  effect: { kind: "discard", target: 0, amount: 2 },
});
