import { defineCard } from "../define.js";

export default defineCard({
  name: "Dissenter's Deliverance",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  cycling: { cost: "{G}" },
  text: "Destroy target artifact.\nCycling {G} ({G}, Discard this card: Draw a card.)",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});
