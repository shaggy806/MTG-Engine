import { defineCard } from "../define.js";

export default defineCard({
  name: "Lay Waste",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  cycling: { cost: "{2}" },
  text: "Destroy target land.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});
