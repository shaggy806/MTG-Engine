import { defineCard } from "../define.js";

export default defineCard({
  name: "Clear",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Destroy target enchantment.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["enchantment"],
  effect: { kind: "destroy", target: 0 },
});
