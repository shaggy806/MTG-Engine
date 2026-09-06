import { defineCard } from "../define.js";

export default defineCard({
  name: "Naturalize",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});
