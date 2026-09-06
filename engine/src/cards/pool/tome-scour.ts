import { defineCard } from "../define.js";

export default defineCard({
  name: "Tome Scour",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player mills five cards.",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: 5 },
});
