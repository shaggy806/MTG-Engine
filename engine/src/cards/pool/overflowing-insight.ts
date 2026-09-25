import { defineCard } from "../define.js";

export default defineCard({
  name: "Overflowing Insight",
  manaCost: "{4}{U}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player draws seven cards.",
  targets: ["player"],
  effect: { kind: "draw", amount: 7, target: 0 },
});
