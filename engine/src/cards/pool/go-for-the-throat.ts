import { defineCard } from "../define.js";

export default defineCard({
  name: "Go for the Throat",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target nonartifact creature.",
  targets: ["nonartifact-creature"],
  effect: { kind: "destroy", target: 0 },
});
