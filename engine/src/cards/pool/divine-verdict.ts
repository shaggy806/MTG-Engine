import { defineCard } from "../define.js";

export default defineCard({
  name: "Divine Verdict",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "destroy", target: 0 },
});
