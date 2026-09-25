import { defineCard } from "../define.js";

export default defineCard({
  name: "Winter's Grasp",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Destroy target land.",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});
