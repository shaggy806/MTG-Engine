import { defineCard } from "../define.js";

export default defineCard({
  name: "Braingeyser",
  manaCost: "{X}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player draws X cards.",
  targets: ["player"],
  effect: { kind: "draw", amount: "x", target: 0 },
});
