import { defineCard } from "../define.js";

export default defineCard({
  name: "Bilbo's Deadly Slice",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature.",
  targets: ["creature"],
  effect: { kind: "destroy", target: 0 },
});
