import { defineCard } from "../define.js";

export default defineCard({
  name: "Rescind",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Return target permanent to its owner's hand.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["permanent"],
  effect: { kind: "return-to-hand", target: 0 },
});
