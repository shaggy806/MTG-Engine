import { defineCard } from "../define.js";

export default defineCard({
  name: "Stroke of Genius",
  manaCost: "{X}{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target player draws X cards.",
  targets: ["player"],
  effect: { kind: "draw", amount: "x", target: 0 },
});
