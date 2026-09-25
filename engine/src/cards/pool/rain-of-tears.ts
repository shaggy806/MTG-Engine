import { defineCard } from "../define.js";

export default defineCard({
  name: "Rain of Tears",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target land.",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});
