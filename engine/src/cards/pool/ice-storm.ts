import { defineCard } from "../define.js";

export default defineCard({
  name: "Ice Storm",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Destroy target land.",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});
