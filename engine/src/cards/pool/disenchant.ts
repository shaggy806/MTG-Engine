import { defineCard } from "../define.js";

export default defineCard({
  name: "Disenchant",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target permanent.",
  targets: ["permanent"],
  effect: { kind: "destroy", target: 0 },
});
