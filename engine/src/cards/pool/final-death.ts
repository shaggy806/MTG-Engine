import { defineCard } from "../define.js";

export default defineCard({
  name: "Final Death",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Exile target creature.",
  targets: ["creature"],
  effect: { kind: "exile", target: 0 },
});
