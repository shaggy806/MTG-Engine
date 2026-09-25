import { defineCard } from "../define.js";

export default defineCard({
  name: "Glimpse the Unthinkable",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["sorcery"],
  text: "Target player mills ten cards.",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: 10 },
});
