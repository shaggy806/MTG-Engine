import { defineCard } from "../define.js";

export default defineCard({
  name: "Ironwright's Cleansing",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Exile target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
