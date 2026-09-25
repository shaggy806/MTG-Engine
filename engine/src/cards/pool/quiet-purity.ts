import { defineCard } from "../define.js";

export default defineCard({
  name: "Quiet Purity",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  subtypes: ["Arcane"],
  text: "Destroy target enchantment.",
  targets: ["enchantment"],
  effect: { kind: "destroy", target: 0 },
});
