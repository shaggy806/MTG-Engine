import { defineCard } from "../define.js";

export default defineCard({
  name: "Altar's Light",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
