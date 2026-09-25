import { defineCard } from "../define.js";

export default defineCard({
  name: "Sinkhole",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target land.",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});
