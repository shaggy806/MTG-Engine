import { defineCard } from "../define.js";

export default defineCard({
  name: "Fell",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target creature.",
  targets: ["creature"],
  effect: { kind: "destroy", target: 0 },
});
