import { defineCard } from "../define.js";

export default defineCard({
  name: "Disenchant",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});
