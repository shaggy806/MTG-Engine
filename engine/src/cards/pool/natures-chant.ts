import { defineCard } from "../define.js";

export default defineCard({
  name: "Nature's Chant",
  manaCost: "{1}{G/W}",
  colors: ["W", "G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});
