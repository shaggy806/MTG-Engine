import { defineCard } from "../define.js";

export default defineCard({
  name: "Impale",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target creature.",
  targets: ["creature"],
  effect: { kind: "destroy", target: 0 },
});
