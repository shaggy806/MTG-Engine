import { defineCard } from "../define.js";

export default defineCard({
  name: "Skycrash",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  cycling: { cost: "{R}" },
  text: "Destroy target artifact.\nCycling {R} ({R}, Discard this card: Draw a card.)",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});
