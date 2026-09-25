import { defineCard } from "../define.js";

export default defineCard({
  name: "Fate Forgotten",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
