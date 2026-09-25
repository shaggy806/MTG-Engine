import { defineCard } from "../define.js";

export default defineCard({
  name: "Fade into Antiquity",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Exile target artifact or enchantment.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
