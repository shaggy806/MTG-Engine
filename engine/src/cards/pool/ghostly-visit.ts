import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghostly Visit",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target nonblack creature.",
  targets: ["nonblack-creature"],
  effect: { kind: "destroy", target: 0 },
});
