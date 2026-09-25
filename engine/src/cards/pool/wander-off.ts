import { defineCard } from "../define.js";

export default defineCard({
  name: "Wander Off",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Exile target creature.",
  targets: ["creature"],
  effect: { kind: "exile", target: 0 },
});
