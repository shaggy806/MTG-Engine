import { defineCard } from "../define.js";

export default defineCard({
  name: "Unmake",
  manaCost: "{W/B}{W/B}{W/B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Exile target creature.",
  targets: ["creature"],
  effect: { kind: "exile", target: 0 },
});
