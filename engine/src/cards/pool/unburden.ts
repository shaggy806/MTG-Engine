import { defineCard } from "../define.js";

export default defineCard({
  name: "Unburden",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  cycling: { cost: "{2}" },
  text: "Target player discards two cards.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["player"],
  effect: { kind: "discard", target: 0, amount: 2 },
});
