import { defineCard } from "../define.js";

export default defineCard({
  name: "Wilt",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Destroy target artifact or enchantment.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});
