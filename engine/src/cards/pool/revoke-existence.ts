import { defineCard } from "../define.js";

export default defineCard({
  name: "Revoke Existence",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Exile target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
