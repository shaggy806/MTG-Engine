import { defineCard } from "../define.js";

export default defineCard({
  name: "Compelling Argument",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  cycling: { cost: "{U}" },
  text: "Target player mills five cards.\nCycling {U} ({U}, Discard this card: Draw a card.)",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: 5 },
});
