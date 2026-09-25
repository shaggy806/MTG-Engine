import { defineCard } from "../define.js";

export default defineCard({
  name: "Demystify",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target enchantment.",
  targets: ["enchantment"],
  effect: { kind: "destroy", target: 0 },
});
