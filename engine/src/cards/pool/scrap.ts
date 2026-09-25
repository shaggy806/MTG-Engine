import { defineCard } from "../define.js";

export default defineCard({
  name: "Scrap",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Destroy target artifact.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});
