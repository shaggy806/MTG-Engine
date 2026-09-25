import { defineCard } from "../define.js";

export default defineCard({
  name: "Forsake the Worldly",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Exile target artifact or enchantment.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
