import { defineCard } from "../define.js";

export default defineCard({
  name: "Stone Rain",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy target land.",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});
