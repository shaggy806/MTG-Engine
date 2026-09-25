import { defineCard } from "../define.js";

export default defineCard({
  name: "Break Asunder",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  cycling: { cost: "{2}" },
  text: "Destroy target artifact or enchantment.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});
