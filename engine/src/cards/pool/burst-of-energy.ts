import { defineCard } from "../define.js";

export default defineCard({
  name: "Burst of Energy",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Untap target permanent.",
  targets: ["permanent"],
  effect: { kind: "untap", target: 0 },
});
