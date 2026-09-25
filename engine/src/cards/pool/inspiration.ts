import { defineCard } from "../define.js";

export default defineCard({
  name: "Inspiration",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target player draws two cards.",
  targets: ["player"],
  effect: { kind: "draw", amount: 2, target: 0 },
});
