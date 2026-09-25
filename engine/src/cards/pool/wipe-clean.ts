import { defineCard } from "../define.js";

export default defineCard({
  name: "Wipe Clean",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  cycling: { cost: "{3}" },
  text: "Exile target enchantment.\nCycling {3} ({3}, Discard this card: Draw a card.)",
  targets: ["enchantment"],
  effect: { kind: "exile", target: 0 },
});
